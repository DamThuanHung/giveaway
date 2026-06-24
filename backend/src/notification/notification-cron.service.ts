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

  // Auto-archive bài available > 30 ngày — không có activity (deal feature gone).
  // Bài cũ sẽ ẩn khỏi feed, không cho complete/review nữa.
  // Author vẫn thấy trong "Bài của tôi" với status 'archived' để biết.
  @Cron('30 4 * * *') // 4:30 sáng UTC = 11:30 sáng VN
  async autoArchiveStalePosts() {
    const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const stale = await this.prisma.post.updateMany({
      where: { status: 'available', createdAt: { lt: cutoff30d } },
      data: { status: 'archived' },
    });
    if (stale.count > 0) {
      console.log(`[NotifCron] Auto-archived ${stale.count} bài available > 30 ngày`);
    }
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

      // Đo "tương tác" qua chat rooms — bài có người chat trong 7 ngày = active
      const recentActivity = await this.prisma.chatRoom.count({
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

  // Welcome notification đã chuyển sang trigger tại thời điểm đăng ký
  // (user.service.ts) — không dùng cron nữa để tránh bỏ sót cửa sổ 24-48h.

  // Group 5: Dọn notification > 30 ngày (chạy 4:00 sáng)
  @Cron('0 4 * * *')
  async deleteOldNotifications() {
    const count = await this.notification.deleteOldNotifications();
    if (count > 0) console.log(`[NotifCron] Deleted ${count} old notifications (>30d)`);
  }

  // Bản tin 12h trưa VN (05:00 UTC)
  @Cron('0 5 * * *')
  async sendMiddayDigest() {
    await this.sendDigest();
  }

  // Bản tin 20h tối VN (13:00 UTC)
  @Cron('0 13 * * *')
  async sendEveningDigest() {
    await this.sendDigest();
  }

  private async sendDigest() {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const [postCount, visitorCount] = await Promise.all([
      this.prisma.post.count({ where: { status: 'available' } }),
      this.prisma.user.count({ where: { updatedAt: { gte: todayStart } } }),
    ]);

    const title = 'Bản tin Trao Tay 📦';
    const body = postCount === 0
      ? 'Hôm nay chưa có bài đăng nào. Đăng ngay món đồ không dùng đến để Trao Tay sôi động hơn nhé!'
      : `Hôm nay có thêm ${visitorCount} lượt khách ghé thăm, có ${postCount} sản phẩm đang được rao trên đó`;

    // Tạo DB record cho TẤT CẢ user — push (FCM/WebPush) được xử lý
    // có điều kiện bên trong createNotification dựa trên token của từng user.
    const allUsers = await this.prisma.user.findMany({ select: { id: true } });
    if (allUsers.length === 0) return;

    await runInBatches(allUsers, async (user) => {
      await this.notification.createNotification(user.id, 'daily_digest', title, body).catch(() => {});
    });

    console.log(`[NotifCron] Digest → ${allUsers.length} users | ${visitorCount} visitors | ${postCount} posts`);
  }
}
