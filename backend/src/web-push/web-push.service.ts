import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

/// Web Push API service. Khác FCM (mobile native) — gửi qua Push API browser
/// (Chrome/Firefox/Edge/Safari iOS 16.4+) với VAPID protocol.
///
/// 1 user có thể có nhiều subscription (Chrome desktop + Firefox + Edge).
/// Khi gửi push fail 410 Gone → endpoint expire → tự xóa khỏi DB.
@Injectable()
export class WebPushService implements OnModuleInit {
  private readonly logger = new Logger(WebPushService.name);
  private vapidPublicKey = '';
  private isReady = false;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY') ?? '';
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY') ?? '';
    const subject = this.config.get<string>('VAPID_SUBJECT') ?? '';

    if (!publicKey || !privateKey || !subject) {
      this.logger.warn(
        '[WebPush] VAPID env vars chưa set (VAPID_PUBLIC_KEY/PRIVATE_KEY/SUBJECT) → web push disabled',
      );
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.vapidPublicKey = publicKey;
    this.isReady = true;
    this.logger.log('[WebPush] VAPID configured, web push ready');
  }

  getPublicKey(): string {
    return this.vapidPublicKey;
  }

  /// Đăng ký subscription mới hoặc update userAgent nếu endpoint đã tồn tại.
  /// 1 endpoint = 1 browser. User logout không xóa subscription (vì endpoint
  /// có thể được user khác login trên cùng browser dùng lại).
  async subscribe(
    userId: string,
    body: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      userAgent?: string;
    },
  ) {
    const existing = await this.prisma.webPushSubscription.findUnique({
      where: { endpoint: body.endpoint },
    });

    if (existing) {
      // Endpoint đã tồn tại — có thể browser cũ đã subscribe của user khác.
      // Cập nhật userId mới + keys (user mới login trên browser này).
      await this.prisma.webPushSubscription.update({
        where: { endpoint: body.endpoint },
        data: {
          userId,
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
          userAgent: body.userAgent,
        },
      });
      return { ok: true, updated: true };
    }

    await this.prisma.webPushSubscription.create({
      data: {
        userId,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: body.userAgent,
      },
    });
    return { ok: true, updated: false };
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.webPushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return { ok: true };
  }

  /// Gửi push tới TẤT CẢ subscription của 1 user (multi-device).
  /// Best effort — fail 1 endpoint không block các endpoint khác.
  /// 410 Gone → tự xóa khỏi DB.
  async sendToUser(
    userId: string,
    payload: {
      title: string;
      body: string;
      icon?: string;
      data?: Record<string, any>;
    },
  ) {
    if (!this.isReady) return { sent: 0, failed: 0, pruned: 0 };

    const subs = await this.prisma.webPushSubscription.findMany({
      where: { userId },
    });
    if (subs.length === 0) return { sent: 0, failed: 0, pruned: 0 };

    const json = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon ?? '/assets/icon_512.png',
      data: payload.data ?? {},
    });

    let sent = 0;
    let failed = 0;
    let pruned = 0;

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            json,
            { TTL: 60 * 60 * 24 }, // 24h TTL — push service giữ tối đa 1 ngày
          );
          sent++;
        } catch (err: any) {
          failed++;
          // 410 Gone hoặc 404 → endpoint expired, prune khỏi DB
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await this.prisma.webPushSubscription
              .delete({ where: { endpoint: sub.endpoint } })
              .catch(() => {});
            pruned++;
          } else {
            this.logger.warn(
              `[WebPush] Send fail userId=${userId} endpoint=${sub.endpoint.slice(0, 50)}... status=${err?.statusCode} body=${err?.body ?? err?.message}`,
            );
          }
        }
      }),
    );

    return { sent, failed, pruned };
  }
}
