import { BadRequestException, Injectable } from '@nestjs/common';
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

  async unhidePost(id: string) {
    return this.prisma.post.update({ where: { id }, data: { status: 'available' } });
  }

  async getPostDetail(id: string) {
    return this.prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true, phone: true, role: true, isBanned: true, createdAt: true } },
        _count: { select: { favorites: true, deals: true, reports: true } },
      },
    });
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
          id: true, name: true, email: true, phone: true, role: true,
          isBanned: true, deletedAt: true, createdAt: true,
          _count: { select: { posts: true, dealsAsRequester: true, reviewsReceived: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data: users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async banUser(id: string, isBanned: boolean) {
    const banFlag = isBanned === true; // strict — reject string/number coerce
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { email: true, phone: true },
    });

    await this.prisma.user.update({ where: { id }, data: { isBanned: banFlag } });

    if (user) {
      if (banFlag) {
        if (user.email) await this.prisma.bannedIdentity.upsert({
          where: { email: user.email }, create: { email: user.email }, update: {},
        });
        if (user.phone) await this.prisma.bannedIdentity.upsert({
          where: { phone: user.phone }, create: { phone: user.phone }, update: {},
        });
      } else {
        if (user.email) await this.prisma.bannedIdentity.deleteMany({ where: { email: user.email } });
        if (user.phone) await this.prisma.bannedIdentity.deleteMany({ where: { phone: user.phone } });
      }
    }

    return { ok: true, isBanned: banFlag };
  }

  async setUserRole(id: string, role: 'admin' | 'user') {
    if (role !== 'admin' && role !== 'user') {
      throw new BadRequestException('role chỉ nhận "admin" hoặc "user"');
    }
    await this.prisma.user.update({ where: { id }, data: { role } });
    return { ok: true, role };
  }

  async getUserDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, phone: true, avatar: true, role: true,
        isBanned: true, isPhoneVerified: true, deletedAt: true, createdAt: true,
        _count: {
          select: {
            posts: true,
            dealsAsRequester: true,
            dealsAsOwner: true,
            reviewsReceived: true,
            favorites: true,
          },
        },
      },
    });
    if (!user) return null;
    // Tính tổng tiền user đã tiêu cho bump
    const spent = await this.prisma.bumpOrder.aggregate({
      where: { userId: id, status: 'paid' },
      _sum: { amount: true },
      _count: true,
    });
    // Avg rating user nhận được
    const ratings = await this.prisma.review.aggregate({
      where: { revieweeId: id },
      _avg: { rating: true },
    });
    return {
      ...user,
      totalSpent: spent._sum.amount ?? 0,
      bumpOrderCount: spent._count ?? 0,
      avgRating: ratings._avg.rating ? +ratings._avg.rating.toFixed(2) : null,
    };
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
    // Runtime validate — TS type không enforce ở JS runtime
    if (action !== 'resolved' && action !== 'dismissed') {
      throw new BadRequestException('action chỉ nhận "resolved" hoặc "dismissed"');
    }
    const report = await this.prisma.report.update({ where: { id }, data: { status: action } });
    if (action === 'resolved') {
      await this.prisma.post.update({ where: { id: report.postId }, data: { status: 'hidden' } });
    }
    return report;
  }

  async getRevenueStats() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalRevenue, todayRevenue, monthRevenue, plusCount, vipCount, activeBoosts] =
      await Promise.all([
        this.prisma.bumpOrder.aggregate({ where: { status: 'paid' }, _sum: { amount: true } }),
        this.prisma.bumpOrder.aggregate({ where: { status: 'paid', createdAt: { gte: today } }, _sum: { amount: true } }),
        this.prisma.bumpOrder.aggregate({ where: { status: 'paid', createdAt: { gte: thisMonth } }, _sum: { amount: true } }),
        this.prisma.bumpOrder.count({ where: { status: 'paid', package: 'plus_3d' } }),
        this.prisma.bumpOrder.count({ where: { status: 'paid', package: 'vip_7d' } }),
        this.prisma.bumpOrder.count({ where: { status: 'paid', expiredAt: { gt: new Date() } } }),
      ]);

    return {
      total: totalRevenue._sum.amount ?? 0,
      today: todayRevenue._sum.amount ?? 0,
      thisMonth: monthRevenue._sum.amount ?? 0,
      breakdown: { plus: plusCount, vip: vipCount },
      activeBoosts,
    };
  }

  /// Doanh thu theo từng ngày trong N ngày gần nhất → cho chart timeline.
  async getRevenueTimeline(days = 30) {
    const safeDays = Math.min(Math.max(1, days), 365);
    const fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
    fromDate.setDate(fromDate.getDate() - safeDays + 1);

    const orders = await this.prisma.bumpOrder.findMany({
      where: { status: 'paid', createdAt: { gte: fromDate } },
      select: { amount: true, createdAt: true },
    });

    // Group theo ngày YYYY-MM-DD
    const map = new Map<string, number>();
    for (let i = 0; i < safeDays; i++) {
      const d = new Date(fromDate);
      d.setDate(fromDate.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, 0);
    }
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + o.amount);
    }

    return Array.from(map.entries()).map(([date, amount]) => ({ date, amount }));
  }

  /// System health — DB, MinIO basic check.
  async getHealthDetail() {
    const checks: Record<string, { ok: boolean; info?: string; error?: string }> = {};
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { ok: true, info: 'PostgreSQL connection OK' };
    } catch (e: any) {
      checks.database = { ok: false, error: e?.message ?? 'unknown' };
    }
    // Process info
    const mem = process.memoryUsage();
    return {
      checks,
      process: {
        uptime: Math.round(process.uptime()),
        memory: {
          rss: Math.round(mem.rss / 1024 / 1024),
          heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        },
        nodeVersion: process.version,
        env: process.env.NODE_ENV ?? 'development',
      },
    };
  }

  async getBumpOrders(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.bumpOrder.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          post: { select: { id: true, title: true } },
        },
      }),
      this.prisma.bumpOrder.count({ where }),
    ]);
    return { data: orders, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
