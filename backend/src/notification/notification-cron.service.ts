import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationCronService {
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService,
  ) {}

  // Group 2a: Nhắc deal pending quá 24 giờ chưa xử lý (chạy mỗi giờ)
  @Cron('0 * * * *')
  async remindPendingDeals() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deals = await this.prisma.deal.findMany({
      where: { status: 'pending', createdAt: { lt: cutoff } },
      include: {
        post: { select: { id: true, title: true } },
        requester: { select: { name: true } },
      },
    });

    for (const deal of deals) {
      await this.notification.createNotification(
        deal.ownerId,
        'deal_reminder',
        'Bạn có yêu cầu chưa xử lý',
        `${deal.requester?.name ?? 'Ai đó'} đang chờ phản hồi cho bài "${deal.post?.title}". Đừng để họ chờ lâu nhé!`,
        JSON.stringify({ dealId: deal.id, postId: deal.postId }),
      ).catch(() => {});
    }
  }

  // Group 2b: Nhắc bài đăng 7 ngày không có tương tác (chạy lúc 9:00 sáng)
  @Cron('0 9 * * *')
  async remindInactivePosts() {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const posts = await this.prisma.post.findMany({
      where: { status: 'available', createdAt: { lt: cutoff } },
      select: { id: true, title: true, authorId: true, updatedAt: true },
    });

    for (const post of posts) {
      // Kiểm tra xem có deal/favorite nào trong 7 ngày qua không
      const recentActivity = await this.prisma.deal.count({
        where: { postId: post.id, createdAt: { gte: cutoff } },
      });
      if (recentActivity > 0 || !post.authorId) continue;

      await this.notification.createNotification(
        post.authorId,
        'post_reminder',
        'Bài đăng của bạn cần được chú ý',
        `Bài "${post.title}" đã 7 ngày chưa có tương tác mới. Hãy cập nhật để thu hút người dùng hơn nhé!`,
        JSON.stringify({ postId: post.id }),
      ).catch(() => {});
    }
  }

  // Group 3: Chào mừng 1 ngày sau khi đăng ký (chạy lúc 10:00 sáng)
  @Cron('0 10 * * *')
  async sendWelcomeNotification() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const newUsers = await this.prisma.user.findMany({
      where: { createdAt: { gte: twoDaysAgo, lt: yesterday } },
      select: { id: true, name: true },
    });

    for (const user of newUsers) {
      await this.notification.createNotification(
        user.id,
        'welcome',
        'Chào mừng bạn đến với Trao Tay! 🎉',
        `Xin chào ${user.name ?? 'bạn'}! Hãy bắt đầu bằng cách đăng bài đầu tiên hoặc khám phá những món đồ thú vị gần bạn nhé.`,
      ).catch(() => {});
    }
  }

  // Group 4: Bản tin hàng ngày lúc 20:00 — số bài đăng mới hôm nay
  @Cron('0 20 * * *')
  async sendDailyDigest() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await this.prisma.post.count({
      where: { createdAt: { gte: todayStart }, status: 'available' },
    });

    if (todayCount === 0) return;

    const users = await this.prisma.user.findMany({ select: { id: true } });

    for (const user of users) {
      await this.notification.createNotification(
        user.id,
        'daily_digest',
        'Bản tin cuối ngày 📦',
        `Hôm nay có ${todayCount} bài đăng mới trên Trao Tay. Khám phá ngay để không bỏ lỡ nhé!`,
      ).catch(() => {});
    }
  }
}
