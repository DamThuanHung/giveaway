import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowService {
  constructor(private prisma: PrismaService) {}

  // Theo dõi user
  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new ForbiddenException('Bạn không thể tự theo dõi chính mình');
    }
    try {
      return await this.prisma.follow.upsert({
        where: { followerId_followingId: { followerId, followingId } },
        update: {},
        create: { followerId, followingId },
      });
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

  // Feed bài đăng từ những người mình đang theo dõi
  async getFeed(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const followingIds = await this.prisma.follow
      .findMany({ where: { followerId: userId }, select: { followingId: true } })
      .then((rows) => rows.map((r) => r.followingId));

    if (followingIds.length === 0) return { data: [], total: 0 };

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { authorId: { in: followingIds }, status: 'available' },
        include: { author: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.post.count({
        where: { authorId: { in: followingIds }, status: 'available' },
      }),
    ]);

    return { data, total };
  }
}
