import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FcmService } from '../fcm/fcm.service';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private fcm: FcmService,
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
      await this.fcm.sendToToken(user.fcmToken, title, body, fcmData);
    }

    return notif;
  }
}
