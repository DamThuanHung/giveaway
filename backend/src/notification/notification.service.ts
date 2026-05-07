import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FcmService } from '../fcm/fcm.service';
import { NotificationGateway } from './notification.gateway';
import { WebPushService } from '../web-push/web-push.service';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private fcm: FcmService,
    private webPush: WebPushService,
    @Optional() private gateway: NotificationGateway,
  ) {}

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, isRead: false } });
    return { count };
  }

  async createNotification(userId: string, type: string, title: string, body: string, data?: string) {
    const notif = await this.prisma.notification.create({ data: { userId, type, title, body, data } });

    // Parse deep-link data 1 lần, dùng cho cả FCM (mobile) + Web Push
    const linkData: Record<string, any> = { type, notificationId: notif.id };
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.roomId) linkData.roomId = parsed.roomId;
        if (parsed.postId) linkData.postId = parsed.postId;
        if (parsed.userId) linkData.userId = parsed.userId;
        if (parsed.followerId) linkData.followerId = parsed.followerId;
      } catch (_) {}
    }

    // Build URL deep link cho web (service worker dùng để focus tab + navigate)
    let webUrl = '/notifications/';
    if (linkData.roomId) webUrl = `/chat/room/?id=${linkData.roomId}`;
    else if (linkData.postId) webUrl = `/posts/${linkData.postId}/`;
    else if (linkData.userId || linkData.followerId)
      webUrl = `/users/${linkData.userId ?? linkData.followerId}/`;

    // Gửi FCM (mobile) + Web Push (browser) PARALLEL — best effort cả 2
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    await Promise.all([
      // FCM mobile
      (async () => {
        if (!user?.fcmToken) return;
        const fcmData: Record<string, string> = {
          type,
          notificationId: notif.id,
          ...(linkData.roomId ? { roomId: linkData.roomId } : {}),
          ...(linkData.postId ? { postId: linkData.postId } : {}),
        };
        const result = await this.fcm.sendToToken(user.fcmToken, title, body, fcmData);
        if (result.invalidToken) {
          await this.prisma.user
            .update({ where: { id: userId }, data: { fcmToken: null } })
            .catch(() => {});
        }
      })(),
      // Web Push browser (Chrome/Firefox/Edge/Safari iOS 16.4+)
      this.webPush.sendToUser(userId, {
        title,
        body,
        data: { ...linkData, url: webUrl },
      }),
    ]);

    // Emit realtime unread count nếu socket đang kết nối
    if (this.gateway) {
      const { count } = await this.getUnreadCount(userId);
      this.gateway.sendToUser(userId, count);
    }

    return notif;
  }

  /** Xóa fcmToken khi user logout — chống user mới nhận push của user cũ trên cùng device */
  async clearFcmToken(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken: null },
    });
    return { ok: true };
  }

  /** Cron dọn notification > 30 ngày — tránh DB grow vô hạn */
  async deleteOldNotifications() {
    const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { count } = await this.prisma.notification.deleteMany({
      where: { createdAt: { lt: threshold } },
    });
    return count;
  }
}
