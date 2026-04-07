import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers, totalPosts, totalDeals, totalReviews,
      newUsersToday, newPostsToday, newDealsToday,
      pendingReports, availablePosts, donePosts,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.deal.count(),
      this.prisma.review.count(),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.post.count({ where: { createdAt: { gte: today } } }),
      this.prisma.deal.count({ where: { createdAt: { gte: today } } }),
      this.prisma.report.count({ where: { status: 'pending' } }),
      this.prisma.post.count({ where: { status: 'available' } }),
      this.prisma.post.count({ where: { status: 'done' } }),
    ]);

    const avgRating = await this.prisma.review.aggregate({ _avg: { rating: true } });

    return {
      overview: { totalUsers, totalPosts, totalDeals, totalReviews },
      today: { newUsers: newUsersToday, newPosts: newPostsToday, newDeals: newDealsToday },
      posts: { available: availablePosts, done: donePosts, other: totalPosts - availablePosts - donePosts },
      moderation: { pendingReports },
      avgRating: avgRating._avg.rating ? +avgRating._avg.rating.toFixed(2) : 0,
    };
  }

  async getAllPosts(page = 1, limit = 20, status?: string, search?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.post.count({ where }),
    ]);

    return { data: posts, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async hidePost(id: string) {
    return this.prisma.post.update({ where: { id }, data: { status: 'hidden' } });
  }

  async deletePost(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }

  async getAllUsers(page = 1, limit = 20, search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, role: true, isBanned: true, createdAt: true,
          _count: { select: { posts: true, dealsAsRequester: true, reviewsReceived: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data: users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async banUser(id: string, isBanned: boolean) {
    return this.prisma.user.update({ where: { id }, data: { isBanned } });
  }

  async getAllReports(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          post: { select: { id: true, title: true, status: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.report.count({ where }),
    ]);
    return { data: reports, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async resolveReport(id: string, action: 'resolved' | 'dismissed') {
    const report = await this.prisma.report.update({ where: { id }, data: { status: action } });
    if (action === 'resolved') {
      await this.prisma.post.update({ where: { id: report.postId }, data: { status: 'hidden' } });
    }
    return report;
  }
}
