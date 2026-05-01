import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FcmService } from '../fcm/fcm.service';
import { Prisma } from '@prisma/client';

const DELETED_BY_ADMIN = 'deleted_by_admin';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private fcm: FcmService,
  ) {}

  /// Ghi 1 dòng audit log cho mọi mutation của admin. Lỗi log không block action.
  private async audit(adminId: string, action: string, targetType: string, targetId: string, metadata?: Record<string, any>) {
    try {
      await this.prisma.adminActionLog.create({
        data: {
          adminId,
          action,
          targetType,
          targetId,
          metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
        },
      });
    } catch (e: any) {
      // Không throw — không muốn audit fail khiến action chính fail
      console.error('[AdminAudit] Failed to write log:', e?.message ?? e);
    }
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers, totalPosts, totalCompleted, totalReviews,
      newUsersToday, newPostsToday, newCompletedToday,
      pendingReports, availablePosts, donePosts, deletedPosts,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count({ where: { NOT: { status: DELETED_BY_ADMIN } } }),
      this.prisma.post.count({ where: { status: 'done' } }),
      this.prisma.review.count(),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.post.count({ where: { createdAt: { gte: today }, NOT: { status: DELETED_BY_ADMIN } } }),
      this.prisma.post.count({ where: { status: 'done', completedAt: { gte: today } } }),
      this.prisma.report.count({ where: { status: 'pending' } }),
      this.prisma.post.count({ where: { status: 'available' } }),
      this.prisma.post.count({ where: { status: 'done' } }),
      this.prisma.post.count({ where: { status: DELETED_BY_ADMIN } }),
    ]);

    const avgRating = await this.prisma.review.aggregate({ _avg: { rating: true } });

    return {
      overview: { totalUsers, totalPosts, totalCompleted, totalReviews },
      today: { newUsers: newUsersToday, newPosts: newPostsToday, newCompleted: newCompletedToday },
      posts: { available: availablePosts, done: donePosts, other: totalPosts - availablePosts - donePosts, deletedByAdmin: deletedPosts },
      moderation: { pendingReports },
      avgRating: avgRating._avg.rating ? +avgRating._avg.rating.toFixed(2) : 0,
    };
  }

  /// Top users by posts/deals + top posts by views — cho widget dashboard.
  async getTop(limit = 5) {
    const safe = Math.min(Math.max(1, limit), 20);
    const [topUsersByPosts, topUsersBySpend, topPostsByViews] = await Promise.all([
      this.prisma.user.findMany({
        take: safe,
        orderBy: { posts: { _count: 'desc' } },
        select: {
          id: true, name: true, email: true, avatar: true,
          _count: { select: { posts: true } },
        },
      }),
      this.prisma.bumpOrder.groupBy({
        by: ['userId'],
        where: { status: 'paid' },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
        take: safe,
      }),
      this.prisma.post.findMany({
        take: safe,
        where: { NOT: { status: DELETED_BY_ADMIN } },
        orderBy: { viewCount: 'desc' },
        select: {
          id: true, title: true, viewCount: true, status: true,
          author: { select: { id: true, name: true } },
        },
      }),
    ]);

    // Hydrate user info cho topUsersBySpend
    const spenderIds = topUsersBySpend.map(s => s.userId);
    const spenderUsers = await this.prisma.user.findMany({
      where: { id: { in: spenderIds } },
      select: { id: true, name: true, email: true, avatar: true },
    });
    const spenderMap = new Map(spenderUsers.map(u => [u.id, u]));
    const topSpenders = topUsersBySpend.map(s => ({
      ...spenderMap.get(s.userId),
      totalSpent: s._sum.amount ?? 0,
      orderCount: s._count,
    }));

    return { topUsersByPosts, topSpenders, topPostsByViews };
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

  async hidePost(adminId: string, id: string) {
    const before = await this.prisma.post.findUnique({ where: { id }, select: { status: true } });
    if (!before) throw new NotFoundException('Bài đăng không tồn tại');
    const result = await this.prisma.post.update({ where: { id }, data: { status: 'hidden' } });
    await this.audit(adminId, 'post.hide', 'post', id, { previousStatus: before.status });
    return result;
  }

  async unhidePost(adminId: string, id: string) {
    const before = await this.prisma.post.findUnique({ where: { id }, select: { status: true } });
    if (!before) throw new NotFoundException('Bài đăng không tồn tại');
    const result = await this.prisma.post.update({ where: { id }, data: { status: 'available' } });
    await this.audit(adminId, 'post.unhide', 'post', id, { previousStatus: before.status });
    return result;
  }

  async getPostDetail(id: string) {
    return this.prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true, phone: true, role: true, isBanned: true, createdAt: true } },
        _count: { select: { favorites: true, reports: true } },
      },
    });
  }

  /// Soft delete: chuyển status='deleted_by_admin' thay vì xóa hẳn.
  /// Lý do: giữ evidence cho dispute, lịch sử giao dịch, có thể restore.
  async deletePost(adminId: string, id: string, reason?: string) {
    const before = await this.prisma.post.findUnique({ where: { id }, select: { status: true, title: true, authorId: true } });
    if (!before) throw new NotFoundException('Bài đăng không tồn tại');
    if (before.status === DELETED_BY_ADMIN) {
      return { ok: true, alreadyDeleted: true };
    }
    await this.prisma.post.update({ where: { id }, data: { status: DELETED_BY_ADMIN } });
    await this.audit(adminId, 'post.delete', 'post', id, {
      previousStatus: before.status,
      title: before.title,
      authorId: before.authorId,
      reason: reason ?? null,
    });
    return { ok: true };
  }

  async getAllUsers(page = 1, limit = 20, search?: string, role?: string, banned?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    if (role === 'admin' || role === 'user') where.role = role;
    if (banned === 'true') where.isBanned = true;
    else if (banned === 'false') where.isBanned = false;

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, phone: true, role: true,
          isBanned: true, deletedAt: true, createdAt: true, avatar: true,
          _count: { select: { posts: true, reviewsReceived: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data: users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async banUser(adminId: string, id: string, isBanned: boolean, reason?: string) {
    const banFlag = isBanned === true; // strict — reject string/number coerce
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { email: true, phone: true, isBanned: true },
    });
    if (!user) throw new NotFoundException('User không tồn tại');

    await this.prisma.user.update({ where: { id }, data: { isBanned: banFlag } });

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

    await this.audit(adminId, banFlag ? 'user.ban' : 'user.unban', 'user', id, {
      previousIsBanned: user.isBanned,
      reason: reason ?? null,
    });

    return { ok: true, isBanned: banFlag };
  }

  async setUserRole(adminId: string, id: string, role: 'admin' | 'user') {
    if (role !== 'admin' && role !== 'user') {
      throw new BadRequestException('role chỉ nhận "admin" hoặc "user"');
    }
    const before = await this.prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!before) throw new NotFoundException('User không tồn tại');
    if (before.role === role) {
      return { ok: true, role, unchanged: true };
    }
    await this.prisma.user.update({ where: { id }, data: { role } });
    await this.audit(adminId, 'user.role', 'user', id, {
      previousRole: before.role,
      newRole: role,
    });
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
            postsCompletedWith: true,
            reviewsReceived: true,
            favorites: true,
          },
        },
      },
    });
    if (!user) return null;
    const spent = await this.prisma.bumpOrder.aggregate({
      where: { userId: id, status: 'paid' },
      _sum: { amount: true },
      _count: true,
    });
    const ratings = await this.prisma.review.aggregate({
      where: { revieweeId: id },
      _avg: { rating: true },
    });
    // Lịch sử admin action targeting user này (bị admin nào, action gì, lúc nào)
    const adminHistory = await this.prisma.adminActionLog.findMany({
      where: { targetType: 'user', targetId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { admin: { select: { name: true, email: true } } },
    });
    return {
      ...user,
      totalSpent: spent._sum.amount ?? 0,
      bumpOrderCount: spent._count ?? 0,
      avgRating: ratings._avg.rating ? +ratings._avg.rating.toFixed(2) : null,
      adminHistory,
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

  async getReportDetail(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        post: {
          select: {
            id: true, title: true, description: true, images: true, status: true, price: true,
            province: true, district: true, createdAt: true,
            author: { select: { id: true, name: true, email: true, isBanned: true, role: true } },
          },
        },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!report) throw new NotFoundException('Báo cáo không tồn tại');

    // Đếm số report khác cùng targeting post này (cho admin biết bài bị tố nhiều lần)
    const otherReportsOnSamePost = await this.prisma.report.count({
      where: { postId: report.postId, NOT: { id } },
    });

    return { ...report, otherReportsOnSamePost };
  }

  async resolveReport(adminId: string, id: string, action: 'resolved' | 'dismissed') {
    if (action !== 'resolved' && action !== 'dismissed') {
      throw new BadRequestException('action chỉ nhận "resolved" hoặc "dismissed"');
    }
    const report = await this.prisma.report.update({ where: { id }, data: { status: action } });
    if (action === 'resolved') {
      await this.prisma.post.update({ where: { id: report.postId }, data: { status: 'hidden' } });
    }
    await this.audit(adminId, action === 'resolved' ? 'report.resolve' : 'report.dismiss', 'report', id, {
      postId: report.postId,
      hidPost: action === 'resolved',
    });
    return report;
  }

  async getRevenueStats() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [totalRevenue, todayRevenue, monthRevenue, lastMonthRevenue, plusCount, vipCount, activeBoosts] =
      await Promise.all([
        this.prisma.bumpOrder.aggregate({ where: { status: 'paid' }, _sum: { amount: true } }),
        this.prisma.bumpOrder.aggregate({ where: { status: 'paid', createdAt: { gte: today } }, _sum: { amount: true } }),
        this.prisma.bumpOrder.aggregate({ where: { status: 'paid', createdAt: { gte: thisMonth } }, _sum: { amount: true } }),
        this.prisma.bumpOrder.aggregate({ where: { status: 'paid', createdAt: { gte: lastMonth, lt: thisMonth } }, _sum: { amount: true } }),
        this.prisma.bumpOrder.count({ where: { status: 'paid', package: 'plus_3d' } }),
        this.prisma.bumpOrder.count({ where: { status: 'paid', package: 'vip_7d' } }),
        this.prisma.bumpOrder.count({ where: { status: 'paid', expiredAt: { gt: new Date() } } }),
      ]);

    const monthAmount = monthRevenue._sum.amount ?? 0;
    const lastMonthAmount = lastMonthRevenue._sum.amount ?? 0;
    const momPct = lastMonthAmount > 0 ? Math.round(((monthAmount - lastMonthAmount) / lastMonthAmount) * 100) : null;

    return {
      total: totalRevenue._sum.amount ?? 0,
      today: todayRevenue._sum.amount ?? 0,
      thisMonth: monthAmount,
      lastMonth: lastMonthAmount,
      momPct,
      breakdown: { plus: plusCount, vip: vipCount },
      activeBoosts,
    };
  }

  /// Doanh thu theo ngày. Ưu tiên from/to (ISO date YYYY-MM-DD); fallback days nếu không có.
  async getRevenueTimeline(days = 30, from?: string, to?: string) {
    let fromDate: Date, toDate: Date;
    if (from && to) {
      fromDate = new Date(from);
      toDate = new Date(to);
      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
        throw new BadRequestException('from/to phải là ISO date hợp lệ');
      }
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);
    } else {
      const safeDays = Math.min(Math.max(1, days), 365);
      toDate = new Date();
      toDate.setHours(23, 59, 59, 999);
      fromDate = new Date();
      fromDate.setHours(0, 0, 0, 0);
      fromDate.setDate(fromDate.getDate() - safeDays + 1);
    }

    const orders = await this.prisma.bumpOrder.findMany({
      where: { status: 'paid', createdAt: { gte: fromDate, lte: toDate } },
      select: { amount: true, createdAt: true },
    });

    // Map mỗi ngày → tổng. Tự fill 0 cho ngày không có đơn để chart không nhảy.
    const map = new Map<string, number>();
    const cursor = new Date(fromDate);
    while (cursor <= toDate) {
      map.set(cursor.toISOString().slice(0, 10), 0);
      cursor.setDate(cursor.getDate() + 1);
    }
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + o.amount);
    }

    return Array.from(map.entries()).map(([date, amount]) => ({ date, amount }));
  }

  /// Health detail — DB + MinIO + process info.
  async getHealthDetail() {
    const checks: Record<string, { ok: boolean; info?: string; error?: string; latencyMs?: number }> = {};

    // DB check
    try {
      const t0 = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { ok: true, info: 'PostgreSQL connection OK', latencyMs: Date.now() - t0 };
    } catch (e: any) {
      checks.database = { ok: false, error: e?.message ?? 'unknown' };
    }

    // MinIO check — gọi /minio/health/live qua endpoint internal
    try {
      const endpoint = process.env.MINIO_ENDPOINT || 'minio';
      const port = process.env.MINIO_PORT || '9000';
      const t0 = Date.now();
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 3000);
      try {
        const res = await fetch(`http://${endpoint}:${port}/minio/health/live`, { signal: ctrl.signal });
        if (res.ok) checks.minio = { ok: true, info: 'MinIO health/live OK', latencyMs: Date.now() - t0 };
        else checks.minio = { ok: false, error: `HTTP ${res.status}` };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (e: any) {
      checks.minio = { ok: false, error: e?.message ?? 'unknown' };
    }

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

  /// Export CSV — không phân trang. Cap 10.000 rows để tránh OOM.
  /// from/to là ISO date string (YYYY-MM-DD).
  async exportBumpOrdersCsv(from?: string, to?: string, status?: string): Promise<string> {
    const where: any = {};
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) {
        const f = new Date(from); f.setHours(0, 0, 0, 0);
        if (Number.isNaN(f.getTime())) throw new BadRequestException('from không hợp lệ');
        where.createdAt.gte = f;
      }
      if (to) {
        const t = new Date(to); t.setHours(23, 59, 59, 999);
        if (Number.isNaN(t.getTime())) throw new BadRequestException('to không hợp lệ');
        where.createdAt.lte = t;
      }
    }

    const orders = await this.prisma.bumpOrder.findMany({
      where,
      take: 10_000,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        post: { select: { title: true } },
      },
    });

    const header = ['ID', 'Ngày', 'User', 'Email', 'SĐT', 'Bài', 'Gói', 'Số tiền (VNĐ)', 'Trạng thái', 'PayOS ID', 'Hết hạn lúc'];
    const rows = orders.map(o => [
      o.id,
      o.createdAt.toISOString(),
      o.user?.name ?? '',
      o.user?.email ?? '',
      o.user?.phone ?? '',
      o.post?.title ?? '',
      o.package,
      o.amount,
      o.status,
      o.payosOrderId ?? '',
      o.expiredAt ? o.expiredAt.toISOString() : '',
    ]);

    return [header, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  /// Broadcast notification cho 1 segment user. Insert notification rows + bắn FCM push.
  /// Dùng PM1 batch pattern (50/lần + sleep 100ms) để không sốc DB + FCM rate limit.
  /// Audit log để xem lịch sử broadcast (segment, count sent/failed) qua tab Audit.
  async broadcastNotification(
    adminId: string,
    segment: 'all' | 'active_30d' | 'inactive_30d' | 'admin',
    title: string,
    body: string,
    data?: string,
  ) {
    const t = (title || '').trim();
    const b = (body || '').trim();
    if (!t || t.length > 100) throw new BadRequestException('Tiêu đề 1-100 ký tự');
    if (!b || b.length > 500) throw new BadRequestException('Nội dung 1-500 ký tự');
    if (!['all', 'active_30d', 'inactive_30d', 'admin'].includes(segment)) {
      throw new BadRequestException('segment không hợp lệ');
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const where: Prisma.UserWhereInput = { isBanned: false, deletedAt: null };
    if (segment === 'admin') {
      where.role = 'admin';
    } else if (segment === 'active_30d') {
      where.posts = { some: { createdAt: { gte: thirtyDaysAgo } } };
    } else if (segment === 'inactive_30d') {
      where.AND = [
        { createdAt: { lt: thirtyDaysAgo } },
        { posts: { none: { createdAt: { gte: thirtyDaysAgo } } } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true, fcmToken: true },
    });

    if (users.length === 0) {
      await this.audit(adminId, 'notification.broadcast', 'notification', 'broadcast', {
        segment, title: t, body: b, totalUsers: 0, sent: 0, failed: 0,
      });
      return { totalUsers: 0, sent: 0, failed: 0, segment };
    }

    // Bulk insert notification rows
    await this.prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: 'admin_broadcast',
        title: t,
        body: b,
        data: data ?? null,
      })),
    });

    // Send FCM push cho user có fcmToken — batch 50 + sleep 100ms
    const tokenedUsers = users.filter((u) => u.fcmToken).map((u) => ({ id: u.id, token: u.fcmToken! }));
    let sent = 0, failed = 0;
    const BATCH_SIZE = 50;
    for (let i = 0; i < tokenedUsers.length; i += BATCH_SIZE) {
      const batch = tokenedUsers.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(async ({ id, token }) => {
        const r = await this.fcm.sendToToken(token, t, b, { type: 'admin_broadcast' })
          .catch(() => ({ ok: false, invalidToken: false }));
        if (r.invalidToken) {
          await this.prisma.user.update({ where: { id }, data: { fcmToken: null } }).catch(() => {});
        }
        return r.ok;
      }));
      sent += results.filter(Boolean).length;
      failed += results.filter((x) => !x).length;
      if (i + BATCH_SIZE < tokenedUsers.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    await this.audit(adminId, 'notification.broadcast', 'notification', 'broadcast', {
      segment, title: t, body: b, totalUsers: users.length, sent, failed,
    });

    return { totalUsers: users.length, sent, failed, segment };
  }

  /// Lấy lịch sử broadcast từ audit log (action='notification.broadcast').
  async getBroadcastHistory(page = 1, limit = 20) {
    const where = { action: 'notification.broadcast' };
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.adminActionLog.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.adminActionLog.count({ where }),
    ]);
    return { data: logs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /// Preview count cho 1 segment trước khi gửi — admin biết broadcast tới bao nhiêu user.
  async previewBroadcastSegment(segment: 'all' | 'active_30d' | 'inactive_30d' | 'admin') {
    if (!['all', 'active_30d', 'inactive_30d', 'admin'].includes(segment)) {
      throw new BadRequestException('segment không hợp lệ');
    }
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const where: Prisma.UserWhereInput = { isBanned: false, deletedAt: null };
    if (segment === 'admin') where.role = 'admin';
    else if (segment === 'active_30d') where.posts = { some: { createdAt: { gte: thirtyDaysAgo } } };
    else if (segment === 'inactive_30d') {
      where.AND = [
        { createdAt: { lt: thirtyDaysAgo } },
        { posts: { none: { createdAt: { gte: thirtyDaysAgo } } } },
      ];
    }

    const [total, withFcm] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: { ...where, fcmToken: { not: null } } }),
    ]);
    return { segment, total, withFcm };
  }

  async getAuditLog(page = 1, limit = 50, targetType?: string, targetId?: string, adminId?: string) {
    const where: any = {};
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (adminId) where.adminId = adminId;

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.adminActionLog.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.adminActionLog.count({ where }),
    ]);
    return { data: logs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
