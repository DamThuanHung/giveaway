import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { formatPost } from '../post/post.service';

@Injectable()
export class FollowService {
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService,
  ) {}

  // Theo dõi user
  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new ForbiddenException('Bạn không thể tự theo dõi chính mình');
    }
    try {
      const result = await this.prisma.follow.upsert({
        where: { followerId_followingId: { followerId, followingId } },
        update: {},
        create: { followerId, followingId },
      });

      // Gửi thông báo cho người được follow
      const follower = await this.prisma.user.findUnique({ where: { id: followerId }, select: { name: true } });
      this.notification.createNotification(
        followingId,
        'follow',
        'Người theo dõi mới',
        `${follower?.name ?? 'Ai đó'} vừa bắt đầu theo dõi bạn`,
        JSON.stringify({ followerId }),
      ).catch(() => {});

      return result;
    } catch {
      throw new BadRequestException('Không thể theo dõi người dùng này');
    }
  }

  // Bỏ theo dõi user
  async unfollow(followerId: string, followingId: string) {
    try {
      return await this.prisma.follow.delete({
        where: { followerId_followingId: { followerId, followingId } },
      });
    } catch {
      return { message: 'Đã bỏ theo dõi hoặc chưa theo dõi' };
    }
  }

  // Kiểm tra đang theo dõi chưa
  async getStatus(followerId: string, followingId: string) {
    const record = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return { isFollowing: !!record };
  }

  // Danh sách người theo dõi mình (followers)
  async getFollowers(userId: string) {
    const rows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => r.follower);
  }

  // Danh sách mình đang theo dõi (following)
  async getFollowing(userId: string) {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => r.following);
  }

  // Đếm followers & following của một user
  async getCounts(userId: string) {
    const [followersCount, followingCount] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);
    return { followersCount, followingCount };
  }

  // Feed bài đăng từ những người mình đang theo dõi.
  // Loại bài của user mình đã block — Follow + Block conflict resolved theo Block
  // (block "thắng" follow). Nếu A follow B rồi block B, A sẽ không thấy bài B.
  async getFeed(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    // Bound limit + page để tránh query DB load lớn
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safePage = Math.max(page, 1);

    const [followingRows, blockedRows] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      }),
      this.prisma.blockedUser.findMany({
        where: { blockerId: userId },
        select: { blockedId: true },
      }),
    ]);

    const blockedIds = new Set(blockedRows.map((r) => r.blockedId));
    const visibleAuthorIds = followingRows
      .map((r) => r.followingId)
      .filter((id) => !blockedIds.has(id));

    if (visibleAuthorIds.length === 0) return { data: [], total: 0 };

    const where = { authorId: { in: visibleAuthorIds }, status: 'available' };
    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: { author: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.post.count({ where }),
    ]);

    // Apply formatPost mỗi post — bù imageUrl computed (sự cố 2026-05-08:
    // /favorite + /follow/feed cùng pattern thiếu formatPost → frontend
    // PostCard fallback 📦)
    return { data: data.map(formatPost), total };
  }
}
