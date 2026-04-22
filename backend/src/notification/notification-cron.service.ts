import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';

const BATCH_SIZE = 50;

async function runInBatches(items: any[], fn: (item: any) => Promise<void>) {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    await Promise.all(items.slice(i, i + BATCH_SIZE).map(fn));
  }
}

@Injectable()
export class NotificationCronService {
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService,
  ) {}

  // Group 2a: Nhắc deal pending quá 24 giờ chưa xử lý (chạy mỗi giờ)
  // Dedup: chỉ nhắc nếu chưa gửi deal_reminder cho deal này trong 24h qua
  @Cron('0 * * * *')
  async remindPendingDeals() {
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deals = await this.prisma.deal.findMany({
      where: { status: 'pending', createdAt: { lt: cutoff24h } },
      include: {
        post: { select: { id: true, title: true } },
        requester: { select: { name: true } },
      },
    });

    await runInBatches(deals, async (deal) => {
      const alreadyNotified = await this.prisma.notification.findFirst({
        where: {
          userId: deal.ownerId,
          type: 'deal_reminder',
          data: { contains: deal.id },
          createdAt: { gte: cutoff24h },
        },
      });
      if (alreadyNotified) return;

      await this.notification.createNotification(
        deal.ownerId,
        'deal_reminder',
        'Bạn có yêu cầu chưa xử lý',
        `${deal.requester?.name ?? 'Ai đó'} đang chờ phản hồi cho bài "${deal.post?.title}". Đừng để họ chờ lâu nhé!`,
        JSON.stringify({ dealId: deal.id, postId: deal.postId }),
      ).catch(() => {});
    });
  }

  // Group 2b: Nhắc bài đăng 7 ngày không có tương tác (chạy lúc 9:00 sáng)
  // Dedup: chỉ nhắc nếu chưa gửi post_reminder cho bài này trong 7 ngày qua
  @Cron('0 9 * * *')
  async remindInactivePosts() {
    const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const posts = await this.prisma.post.findMany({
      where: { status: 'available', createdAt: { lt: cutoff7d } },
      select: { id: true, title: true, authorId: true },
    });

    await runInBatches(posts, async (post) => {
      if (!post.authorId) return;

      const recentActivity = await this.prisma.deal.count({
        where: { postId: post.id, createdAt: { gte: cutoff7d } },
      });
      if (recentActivity > 0) return;

      const alreadyNotified = await this.prisma.notification.findFirst({
        where: {
          userId: post.authorId,
          type: 'post_reminder',
          data: { contains: post.id },
          createdAt: { gte: cutoff7d },
        },
      });
      if (alreadyNotified) return;

      await this.notification.createNotification(
        post.authorId,
        'post_reminder',
        'Bài đăng của bạn cần được chú ý',
        `Bài "${post.title}" đã 7 ngày chưa có tương tác mới. Hãy cập nhật để thu hút người dùng hơn nhé!`,
        JSON.stringify({ postId: post.id }),
      ).catch(() => {});
    });
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

    await runInBatches(newUsers, async (user) => {
      await this.notification.createNotification(
        user.id,
        'welcome',
        'Chào mừng bạn đến với Trao Tay! 🎉',
        `Xin chào ${user.name ?? 'bạn'}! Hãy bắt đầu bằng cách đăng bài đầu tiên hoặc khám phá những món đồ thú vị gần bạn nhé.`,
      ).catch(() => {});
    });
  }

  // Group 4: Bản tin hàng ngày lúc 20:00 — số bài đăng mới hôm nay
  // Chỉ gửi cho user có fcmToken (đang dùng app)
  @Cron('0 20 * * *')
  async sendDailyDigest() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await this.prisma.post.count({
      where: { createdAt: { gte: todayStart }, status: 'available' },
    });

    if (todayCount === 0) return;

    const users = await this.prisma.user.findMany({
      where: { fcmToken: { not: null } },
      select: { id: true },
    });

    await runInBatches(users, async (user) => {
      await this.notification.createNotification(
        user.id,
        'daily_digest',
        'Bản tin cuối ngày 📦',
        `Hôm nay có ${todayCount} bài đăng mới trên Trao Tay. Khám phá ngay để không bỏ lỡ nhé!`,
      ).catch(() => {});
    });
  }
}
