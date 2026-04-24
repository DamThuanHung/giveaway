import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FcmService } from '../fcm/fcm.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private fcm: FcmService,
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

    // Gửi FCM push notification nếu user có fcmToken
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { fcmToken: true } });
    if (user?.fcmToken) {
      const fcmData: Record<string, string> = { type, notificationId: notif.id };
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.roomId) fcmData.roomId = parsed.roomId;
          if (parsed.postId) fcmData.postId = parsed.postId;
        } catch (_) {}
      }
      const result = await this.fcm.sendToToken(user.fcmToken, title, body, fcmData);
      // Token invalid (user uninstall/đổi device) → clear khỏi DB, lần sau skip
      if (result.invalidToken) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { fcmToken: null },
        }).catch(() => {}); // best effort
      }
    }

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
