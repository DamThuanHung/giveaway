import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FcmService } from '../fcm/fcm.service';
import { Prisma } from '@prisma/client';
import { formatPost } from '../post/post.service';
import { AnalyticsPeriod, CloudflareAnalyticsService } from './cloudflare-analytics.service';

const DELETED_BY_ADMIN = 'deleted_by_admin';

/// Tính mốc thời gian `since` cho period filter — dùng start-of-period theo
/// múi giờ Asia/Bangkok (UTC+7) để match user expectation Việt Nam:
/// - day: 00:00 hôm nay (+7)
/// - week: 00:00 thứ 2 tuần này
/// - month: 00:00 ngày 1 tháng này
/// - year: 00:00 ngày 1 tháng 1 năm này
/// - all: null (không filter)
function computeSince(period: 'day' | 'week' | 'month' | 'year' | 'all'): Date | null {
  if (period === 'all') return null;
  const TZ_OFFSET_MS = 7 * 60 * 60 * 1000;
  const nowVN = new Date(Date.now() + TZ_OFFSET_MS);
  let startVN: Date;
  if (period === 'day') {
    startVN = new Date(Date.UTC(nowVN.getUTCFullYear(), nowVN.getUTCMonth(), nowVN.getUTCDate()));
  } else if (period === 'week') {
    const dow = nowVN.getUTCDay(); // 0=CN, 1=T2 ... 6=T7
    const daysFromMonday = (dow + 6) % 7;
    startVN = new Date(Date.UTC(nowVN.getUTCFullYear(), nowVN.getUTCMonth(), nowVN.getUTCDate() - daysFromMonday));
  } else if (period === 'month') {
    startVN = new Date(Date.UTC(nowVN.getUTCFullYear(), nowVN.getUTCMonth(), 1));
  } else {
    startVN = new Date(Date.UTC(nowVN.getUTCFullYear(), 0, 1));
  }
  return new Date(startVN.getTime() - TZ_OFFSET_MS);
}

/// 18 categories mặc định — match `app/lib/data/categories.dart` AppCategories.list.
/// Nếu Category table rỗng (deploy đầu hoặc DB mới), seed tự động ở onModuleInit.
const DEFAULT_CATEGORIES = [
  { value: 'electronics', label: 'Điện tử',     icon: 'assets/icons/categories/electronics.png' },
  { value: 'furniture',   label: 'Nội thất',    icon: 'assets/icons/categories/furniture.png' },
  { value: 'clothing',    label: 'Thời trang',  icon: 'assets/icons/categories/clothing.png' },
  { value: 'kitchen',     label: 'Gia dụng',    icon: 'assets/icons/categories/kitchen.png' },
  { value: 'books',       label: 'Sách',        icon: 'assets/icons/categories/books.png' },
  { value: 'toys',        label: 'Đồ chơi',     icon: 'assets/icons/categories/toys.png' },
  { value: 'sports',      label: 'Thể thao',    icon: 'assets/icons/categories/sports.png' },
  { value: 'vehicles',    label: 'Xe cộ',       icon: 'assets/icons/categories/vehicles.png' },
  { value: 'beauty',      label: 'Làm đẹp',     icon: 'assets/icons/categories/beauty.png' },
  { value: 'pets',        label: 'Thú cưng',    icon: 'assets/icons/categories/pets.png' },
  { value: 'tools',       label: 'Đồ nghề',     icon: 'assets/icons/categories/tools.png' },
  { value: 'food',        label: 'Thực phẩm',   icon: 'assets/icons/categories/food.png' },
  { value: 'baby',        label: 'Mẹ & Bé',     icon: 'assets/icons/categories/baby.png' },
  { value: 'music',       label: 'Nhạc cụ',     icon: 'assets/icons/categories/music.png' },
  { value: 'realestate',  label: 'Bất động sản', icon: 'assets/icons/categories/realestate.png' },
  { value: 'service',     label: 'Rao dịch vụ', icon: 'assets/icons/categories/service.png' },
  { value: 'jobs',        label: 'Việc làm',    icon: 'assets/icons/categories/jobs.png' },
  { value: 'other',       label: 'Khác',        icon: 'assets/icons/categories/other.png' },
];

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private fcm: FcmService,
    private cfAnalytics: CloudflareAnalyticsService,
  ) {}

  async onModuleInit() {
    // Seed default categories nếu table rỗng (deploy đầu / DB mới).
    try {
      const count = await this.prisma.category.count();
      if (count === 0) {
        await this.prisma.category.createMany({
          data: DEFAULT_CATEGORIES.map((c, i) => ({ ...c, sortOrder: i, enabled: true })),
        });
        console.log(`[AdminService] Seeded ${DEFAULT_CATEGORIES.length} default categories`);
      }
    } catch (e: any) {
      // Bỏ qua nếu Category table chưa exist (chưa db push) — sẽ seed lần restart sau
      console.warn('[AdminService] Skip category seed:', e?.message ?? e);
    }
  }

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
  /// period: 'day' | 'week' | 'month' | 'year' | 'all' (mặc định 'all').
  /// - topUsersByPosts: đếm Post.createdAt >= since
  /// - topSpenders: SUM BumpOrder.amount status=paid, createdAt >= since
  /// - topPostsByViews:
  ///   • period='all' → sort Post.viewCount lifetime
  ///   • period khác → SUM PostView.count where date >= since (ADR-0010)
  async getTop(limit = 5, period: 'day' | 'week' | 'month' | 'year' | 'all' = 'all') {
    const safe = Math.min(Math.max(1, limit), 20);
    const since = computeSince(period);

    const postCreatedFilter = since ? { createdAt: { gte: since } } : {};
    const bumpCreatedFilter = since ? { createdAt: { gte: since } } : {};

    // topPostsByViews — chia 2 nhánh: lifetime vs period.
    const topPostsByViewsPromise: Promise<any[]> = since == null
      ? this.prisma.post.findMany({
          take: safe,
          where: { NOT: { status: DELETED_BY_ADMIN } },
          orderBy: { viewCount: 'desc' },
          select: {
            id: true, title: true, viewCount: true, status: true,
            author: { select: { id: true, name: true } },
          },
        })
      : (async () => {
          // Aggregate PostView trong period → top postId theo SUM(count).
          const grouped = await this.prisma.postView.groupBy({
            by: ['postId'],
            where: { date: { gte: since } },
            _sum: { count: true },
            orderBy: { _sum: { count: 'desc' } },
            take: safe,
          });
          if (grouped.length === 0) return [];
          const postIds = grouped.map(g => g.postId);
          const posts = await this.prisma.post.findMany({
            where: { id: { in: postIds }, NOT: { status: DELETED_BY_ADMIN } },
            select: {
              id: true, title: true, viewCount: true, status: true,
              author: { select: { id: true, name: true } },
            },
          });
          const postMap = new Map(posts.map(p => [p.id, p]));
          // Giữ thứ tự từ groupBy (đã sort), kèm periodViews đúng period.
          return grouped
            .map(g => {
              const p = postMap.get(g.postId);
              if (!p) return null; // post bị xóa giữa chừng
              return { ...p, periodViews: g._sum.count ?? 0 };
            })
            .filter((x): x is NonNullable<typeof x> => x != null);
        })();

    const [topUsersByPostsRaw, topUsersBySpend, topPostsByViews] = await Promise.all([
      this.prisma.post.groupBy({
        by: ['authorId'],
        where: {
          NOT: { status: DELETED_BY_ADMIN },
          authorId: { not: null },
          ...postCreatedFilter,
        },
        _count: { _all: true },
        orderBy: { _count: { authorId: 'desc' } },
        take: safe,
      }),
      this.prisma.bumpOrder.groupBy({
        by: ['userId'],
        where: { status: 'paid', ...bumpCreatedFilter },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
        take: safe,
      }),
      topPostsByViewsPromise,
    ]);

    const userIds = Array.from(new Set([
      ...topUsersByPostsRaw.map(p => p.authorId).filter((id): id is string => !!id),
      ...topUsersBySpend.map(s => s.userId),
    ]));
    const users = userIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, avatar: true },
        })
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    const topUsersByPosts = topUsersByPostsRaw.map(p => ({
      ...userMap.get(p.authorId!),
      _count: { posts: p._count._all },
    }));
    const topSpenders = topUsersBySpend.map(s => ({
      ...userMap.get(s.userId),
      totalSpent: s._sum.amount ?? 0,
      orderCount: s._count,
    }));

    return { topUsersByPosts, topSpenders, topPostsByViews, period };
  }

  async getAllPosts(page = 1, limit = 20, status?: string, search?: string, authorId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (authorId) where.authorId = authorId;

    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.post.count({ where }),
    ]);

    // Apply formatPost mỗi post — bù imageUrl computed (cùng pattern fix
    // 2026-05-08 với /favorite + /follow/feed)
    return { data: posts.map(formatPost), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
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

  /// Khôi phục bài đã soft-delete: chỉ chấp nhận nếu status='deleted_by_admin'.
  /// Đặt lại status='available' (mặc định công khai) — admin có thể ẩn lại nếu cần.
  async restorePost(adminId: string, id: string) {
    const before = await this.prisma.post.findUnique({ where: { id }, select: { status: true } });
    if (!before) throw new NotFoundException('Bài đăng không tồn tại');
    if (before.status !== DELETED_BY_ADMIN) {
      throw new BadRequestException(`Chỉ khôi phục được bài đã xóa. Bài này status='${before.status}'`);
    }
    const result = await this.prisma.post.update({ where: { id }, data: { status: 'available' } });
    await this.audit(adminId, 'post.restore', 'post', id, { previousStatus: before.status });
    return result;
  }

  /// Admin grant Plus/VIP miễn phí cho 1 bài (không qua PayOS).
  /// Use case: cứu trợ thiên tai, marketing thị trường mới, bù đắp lỗi payment,
  /// reward user uy tín. KHÔNG hiện badge "Admin chọn" — public coi như VIP/Plus thường.
  ///
  /// Guardrails:
  /// 1. Reason BẮT BUỘC, min 10 ký tự — forensics cho audit log.
  /// 2. Days cap: Plus 1-7, VIP 1-30 — chống bug nhập sai.
  /// 3. Self-protection: admin không grant cho bài chính mình.
  /// 4. Status check: chỉ available/reserved — không grant cho hidden/deleted.
  /// 5. Tier upgrade only: bài đang Plus → grant VIP OK, grant lại Plus → reject;
  ///    bài đang VIP → reject (không có tier cao hơn).
  /// 6. Tạo BumpOrder amount=0, status='paid' để cron resetExpiredBoosts vẫn hoạt động.
  async grantBump(
    adminId: string,
    postId: string,
    body: { tier: 'plus' | 'vip'; days: number; reason: string },
  ) {
    const { tier, days, reason } = body;

    // Validation
    if (tier !== 'plus' && tier !== 'vip') {
      throw new BadRequestException('Tier phải là "plus" hoặc "vip"');
    }
    if (!reason || reason.trim().length < 10) {
      throw new BadRequestException('Lý do tối thiểu 10 ký tự (bắt buộc cho audit log)');
    }
    if (reason.trim().length > 500) {
      throw new BadRequestException('Lý do tối đa 500 ký tự');
    }
    if (!Number.isInteger(days) || days < 1) {
      throw new BadRequestException('Số ngày phải là số nguyên ≥ 1');
    }
    const maxDays = tier === 'plus' ? 7 : 30;
    if (days > maxDays) {
      throw new BadRequestException(`Plus tối đa 7 ngày, VIP tối đa 30 ngày. Yêu cầu ${days} vượt quá.`);
    }

    const newTier = tier === 'plus' ? 2 : 3;

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true, authorId: true, title: true, boostTier: true },
    });
    if (!post) throw new NotFoundException('Bài đăng không tồn tại');

    // Bài ẩn danh không có user nhận → không grant được (BumpOrder.userId required)
    if (!post.authorId) {
      throw new BadRequestException('Bài ẩn danh không thể grant — không có user để gắn đơn');
    }

    // Self-protection
    if (post.authorId === adminId) {
      throw new BadRequestException('Không thể grant bump cho bài của chính mình');
    }

    // Status check
    if (post.status !== 'available' && post.status !== 'reserved') {
      throw new BadRequestException(
        `Chỉ grant được cho bài đang hiển thị (available/reserved). Bài này status='${post.status}'`,
      );
    }

    // Tier upgrade only
    const currentTier = post.boostTier ?? 0;
    if (currentTier === newTier) {
      throw new BadRequestException(
        `Bài đang ${tier === 'plus' ? 'Plus' : 'VIP'} rồi — không grant lại cùng tier. Chờ hết hạn hoặc chọn tier cao hơn.`,
      );
    }
    if (currentTier > newTier) {
      throw new BadRequestException(
        `Không downgrade được — bài đang VIP, không thể grant Plus.`,
      );
    }

    const now = new Date();
    const expiredAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const adminGrantOrderId = `AG_${adminId.slice(0, 8)}_${now.getTime()}`;

    // Tạo BumpOrder + update Post atomically
    const [bumpOrder] = await this.prisma.$transaction([
      this.prisma.bumpOrder.create({
        data: {
          userId: post.authorId!,
          postId: post.id,
          package: tier === 'plus' ? 'admin_grant_plus' : 'admin_grant_vip',
          tier: newTier,
          amount: 0,
          status: 'paid',
          payosOrderId: adminGrantOrderId,
          expiredAt,
        },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { boostTier: newTier, bumpedAt: now },
      }),
    ]);

    // Notification cho user (best effort — không block grant nếu fail)
    if (post.authorId) {
      const tierLabel = tier === 'plus' ? 'Plus' : 'VIP';
      await this.prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'admin_grant_bump',
          title: `Bài của bạn được nâng cấp ${tierLabel} miễn phí`,
          body: `Bài "${post.title}" đã được nâng cấp lên ${tierLabel} ${days} ngày miễn phí. Lý do: ${reason.trim()}`,
          data: JSON.stringify({ postId: post.id, tier: newTier, days }),
        },
      }).catch(() => {});
    }

    await this.audit(adminId, 'post.grant_bump', 'post', postId, {
      tier,
      tierInt: newTier,
      days,
      reason: reason.trim(),
      originalTier: currentTier,
      bumpOrderId: bumpOrder.id,
      expiredAt: expiredAt.toISOString(),
      authorId: post.authorId,
      title: post.title,
    });

    return {
      ok: true,
      postId,
      tier,
      tierInt: newTier,
      days,
      expiredAt: expiredAt.toISOString(),
      bumpOrderId: bumpOrder.id,
    };
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

    // Đếm pending reports trên bài của từng user trong page hiện tại — cho repeat-offender badge.
    // 20 count queries parallel — chấp nhận được cho admin panel; nếu chậm sẽ chuyển sang $queryRaw groupBy.
    const userIds = users.map(u => u.id);
    const reportCounts = userIds.length === 0 ? [] : await Promise.all(
      userIds.map(id =>
        this.prisma.report.count({
          where: { post: { authorId: id }, status: 'pending' },
        })
      )
    );
    const reportMap = new Map(userIds.map((id, i) => [id, reportCounts[i]]));
    const usersWithReports = users.map(u => ({ ...u, pendingReportsOnPosts: reportMap.get(u.id) ?? 0 }));

    return { data: usersWithReports, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async banUser(adminId: string, id: string, isBanned: boolean, reason?: string) {
    const banFlag = isBanned === true; // strict — reject string/number coerce
    // Self-protection: chặn admin tự ban chính mình → tránh lockout vĩnh viễn (chỉ rescue được bằng SQL).
    if (id === adminId) {
      throw new BadRequestException('Không thể tự khóa tài khoản của chính mình');
    }
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

  /// Bulk ban: khóa N user/lần (cap 50). Skip selfId; mỗi user vẫn ghi audit log riêng + blacklist email/phone.
  /// Return chi tiết success/failed để UI hiển thị.
  async bulkBanUsers(adminId: string, ids: string[], reason?: string) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Cần ít nhất 1 user');
    }
    if (ids.length > 50) {
      throw new BadRequestException('Tối đa 50 user/lần');
    }
    const unique = Array.from(new Set(ids));
    const targets = unique.filter(id => id && id !== adminId);
    const skippedSelf = unique.length - targets.length;
    let success = 0;
    const errors: { id: string; error: string }[] = [];
    for (const id of targets) {
      try {
        await this.banUser(adminId, id, true, reason);
        success++;
      } catch (e: any) {
        errors.push({ id, error: e?.message || 'Unknown error' });
      }
    }
    return { success, failed: errors.length, skippedSelf, errors };
  }

  async setUserRole(adminId: string, id: string, role: 'admin' | 'user') {
    if (role !== 'admin' && role !== 'user') {
      throw new BadRequestException('role chỉ nhận "admin" hoặc "user"');
    }
    // Self-protection: admin không tự hạ quyền chính mình → tránh lockout khi chỉ còn 1 admin.
    if (id === adminId && role !== 'admin') {
      throw new BadRequestException('Không thể tự hạ quyền admin của chính mình');
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
    // Pending reports targeting bài của user này — surface repeat-offender mức nghiêm trọng.
    const pendingReportsOnPosts = await this.prisma.report.count({
      where: { post: { authorId: id }, status: 'pending' },
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
      pendingReportsOnPosts,
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

  // ─── Category management ──────────────────────────
  async getAllCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
    // Đếm số post sử dụng mỗi category — admin biết category nào đang active.
    // Group by Post.itemCategory (String) match Category.value.
    const usage = await this.prisma.post.groupBy({
      by: ['itemCategory'],
      _count: { id: true },
      where: { NOT: { status: DELETED_BY_ADMIN } },
    });
    const usageMap = new Map(usage.map((u) => [u.itemCategory, u._count.id]));
    return categories.map((c) => ({ ...c, postCount: usageMap.get(c.value) ?? 0 }));
  }

  async createCategory(adminId: string, data: { value: string; label: string; icon?: string; sortOrder?: number }) {
    const value = (data.value || '').trim().toLowerCase();
    const label = (data.label || '').trim();
    if (!value || !/^[a-z0-9_-]+$/.test(value)) {
      throw new BadRequestException('value chỉ chứa a-z, 0-9, _, - (slug)');
    }
    if (!label || label.length > 50) throw new BadRequestException('label 1-50 ký tự');

    const exists = await this.prisma.category.findUnique({ where: { value } });
    if (exists) throw new BadRequestException(`Category "${value}" đã tồn tại`);

    const category = await this.prisma.category.create({
      data: {
        value, label,
        icon: data.icon ?? null,
        sortOrder: data.sortOrder ?? 0,
      },
    });
    await this.audit(adminId, 'category.create', 'category', category.id, { value, label });
    return category;
  }

  async updateCategory(adminId: string, id: string, data: { label?: string; icon?: string | null; sortOrder?: number; enabled?: boolean }) {
    const before = await this.prisma.category.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Danh mục không tồn tại');

    const update: Prisma.CategoryUpdateInput = {};
    if (data.label !== undefined) {
      const label = data.label.trim();
      if (!label || label.length > 50) throw new BadRequestException('label 1-50 ký tự');
      update.label = label;
    }
    if (data.icon !== undefined) update.icon = data.icon;
    if (data.sortOrder !== undefined) update.sortOrder = data.sortOrder;
    if (data.enabled !== undefined) update.enabled = data.enabled === true;

    const category = await this.prisma.category.update({ where: { id }, data: update });
    await this.audit(adminId, 'category.update', 'category', id, {
      before: { label: before.label, sortOrder: before.sortOrder, enabled: before.enabled },
      after: { label: category.label, sortOrder: category.sortOrder, enabled: category.enabled },
    });
    return category;
  }

  /// Delete category — chỉ cho phép nếu KHÔNG còn post nào dùng category này.
  /// Nếu còn post → throw BadRequest, admin phải disable thay vì delete.
  async deleteCategory(adminId: string, id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Danh mục không tồn tại');

    const postCount = await this.prisma.post.count({
      where: { itemCategory: category.value, NOT: { status: DELETED_BY_ADMIN } },
    });
    if (postCount > 0) {
      throw new BadRequestException(`Không xóa được — còn ${postCount} bài đang dùng category "${category.value}". Hãy disable thay vì delete.`);
    }

    await this.prisma.category.delete({ where: { id } });
    await this.audit(adminId, 'category.delete', 'category', id, {
      value: category.value, label: category.label,
    });
    return { ok: true };
  }

  // ─── Refund management ────────────────────────────
  /// Hoàn tiền 1 bump order — set status='refunded' + reverse boost effect.
  /// Tiền thật admin tự hoàn qua PayOS dashboard / bank transfer.
  /// Notify user qua notification + audit log.
  async refundBumpOrder(adminId: string, orderId: string, reason?: string) {
    const order = await this.prisma.bumpOrder.findUnique({
      where: { id: orderId },
      include: { post: { select: { id: true, title: true, boostTier: true } } },
    });
    if (!order) throw new NotFoundException('Đơn không tồn tại');
    if (order.status !== 'paid') {
      throw new BadRequestException(`Chỉ refund được đơn paid. Đơn này status='${order.status}'`);
    }

    await this.prisma.$transaction([
      this.prisma.bumpOrder.update({
        where: { id: orderId },
        data: {
          status: 'refunded',
          refundedAt: new Date(),
          refundReason: reason ?? null,
        },
      }),
      // Reverse boost: nếu post đang được boost bởi đơn này → reset boostTier=0
      this.prisma.post.updateMany({
        where: { id: order.postId, boostTier: order.tier },
        data: { boostTier: 0, bumpedAt: null },
      }),
    ]);

    // Notify user (best effort, không block refund nếu fail)
    await this.prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'admin_refund',
        title: 'Đơn bump đã được hoàn tiền',
        body: `Đơn ${order.package} cho bài "${order.post?.title || ''}" đã được hoàn ${order.amount.toLocaleString('vi-VN')}đ. Lý do: ${reason || 'không nêu'}`,
        data: JSON.stringify({ orderId, postId: order.postId }),
      },
    }).catch(() => {});

    await this.audit(adminId, 'bumporder.refund', 'bumporder', orderId, {
      postId: order.postId,
      userId: order.userId,
      package: order.package,
      amount: order.amount,
      payosOrderId: order.payosOrderId,
      reason: reason ?? null,
    });

    return { ok: true, orderId, refundedAmount: order.amount };
  }

  // ─── Chat moderation ──────────────────────────────
  /// List chat rooms order by recent activity (updatedAt). Filter optionally
  /// theo postId hoặc userId (xem chat của 1 user/post cụ thể).
  async getAllChatRooms(page = 1, limit = 20, search?: string, postId?: string, userId?: string) {
    const where: Prisma.ChatRoomWhereInput = {};
    if (postId) where.postId = postId;
    if (userId) where.OR = [{ buyerId: userId }, { sellerId: userId }];
    if (search) {
      // Search theo tên user (buyer hoặc seller) hoặc title bài
      where.AND = [
        ...(where.AND as any[] || []),
        {
          OR: [
            { buyer: { name: { contains: search, mode: 'insensitive' } } },
            { seller: { name: { contains: search, mode: 'insensitive' } } },
            { post: { title: { contains: search, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const skip = (page - 1) * limit;
    const [rooms, total] = await Promise.all([
      this.prisma.chatRoom.findMany({
        where, skip, take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          buyer: { select: { id: true, name: true, email: true, avatar: true } },
          seller: { select: { id: true, name: true, email: true, avatar: true } },
          post: { select: { id: true, title: true, status: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.chatRoom.count({ where }),
    ]);
    return { data: rooms, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getChatRoomDetail(roomId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        buyer: { select: { id: true, name: true, email: true, phone: true, avatar: true, isBanned: true } },
        seller: { select: { id: true, name: true, email: true, phone: true, avatar: true, isBanned: true } },
        post: { select: { id: true, title: true, status: true, price: true, images: true } },
        _count: { select: { messages: true } },
      },
    });
    if (!room) throw new NotFoundException('Phòng chat không tồn tại');
    return room;
  }

  /// Lấy messages trong room theo thứ tự thời gian (chat history).
  /// Pagination từ cũ → mới (page 1 = cũ nhất). Cap limit 100 để tránh OOM.
  async getChatMessages(roomId: string, page = 1, limit = 50) {
    const room = await this.prisma.chatRoom.findUnique({ where: { id: roomId }, select: { id: true } });
    if (!room) throw new NotFoundException('Phòng chat không tồn tại');
    const safe = Math.min(Math.max(1, limit), 100);
    const skip = (page - 1) * safe;
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { roomId },
        skip, take: safe,
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true, avatar: true } } },
      }),
      this.prisma.message.count({ where: { roomId } }),
    ]);
    return { data: messages, meta: { page, limit: safe, total, totalPages: Math.ceil(total / safe) } };
  }

  /// Hard delete message — text/ảnh xấu phải biến mất khỏi chat 2 user.
  /// Audit log preserves original text + sender + room cho evidence.
  async deleteMessage(adminId: string, messageId: string, reason?: string) {
    const before = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!before) throw new NotFoundException('Tin nhắn không tồn tại');
    await this.prisma.message.delete({ where: { id: messageId } });
    await this.audit(adminId, 'message.delete', 'message', messageId, {
      roomId: before.roomId,
      senderId: before.senderId,
      text: before.text,
      reason: reason ?? null,
    });
    return { ok: true };
  }

  // ─── Review moderation ────────────────────────────
  async getAllReviews(page = 1, limit = 20, rating?: number, search?: string, postId?: string) {
    const where: Prisma.ReviewWhereInput = {};
    if (rating && rating >= 1 && rating <= 5) where.rating = rating;
    if (postId) where.postId = postId;
    if (search) {
      where.OR = [
        { reviewer: { name: { contains: search, mode: 'insensitive' } } },
        { reviewer: { email: { contains: search, mode: 'insensitive' } } },
        { reviewee: { name: { contains: search, mode: 'insensitive' } } },
        { reviewee: { email: { contains: search, mode: 'insensitive' } } },
        { comment: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { id: true, name: true, email: true, avatar: true } },
          reviewee: { select: { id: true, name: true, email: true, avatar: true } },
          post: { select: { id: true, title: true, status: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);
    return { data: reviews, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getReviewDetail(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        reviewer: { select: { id: true, name: true, email: true, phone: true, avatar: true, role: true, isBanned: true } },
        reviewee: { select: { id: true, name: true, email: true, phone: true, avatar: true, role: true, isBanned: true } },
        post: { select: { id: true, title: true, status: true, completedAt: true } },
      },
    });
    if (!review) throw new NotFoundException('Đánh giá không tồn tại');

    // Avg rating của reviewee để admin biết user này nhận trung bình mấy sao
    const revieweeStats = await this.prisma.review.aggregate({
      where: { revieweeId: review.revieweeId },
      _avg: { rating: true },
      _count: true,
    });

    return {
      ...review,
      revieweeAvgRating: revieweeStats._avg.rating ? +revieweeStats._avg.rating.toFixed(2) : null,
      revieweeReviewCount: revieweeStats._count,
    };
  }

  /// Hard delete review — review xấu/giả/spam thực sự cần biến mất khỏi user profile.
  /// Audit log giữ evidence (postId, reviewerId, revieweeId, rating, comment).
  async deleteReview(adminId: string, id: string, reason?: string) {
    const before = await this.prisma.review.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Đánh giá không tồn tại');
    await this.prisma.review.delete({ where: { id } });
    await this.audit(adminId, 'review.delete', 'review', id, {
      postId: before.postId,
      reviewerId: before.reviewerId,
      revieweeId: before.revieweeId,
      rating: before.rating,
      comment: before.comment,
      reason: reason ?? null,
    });
    return { ok: true };
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

  async getAnalytics(period: AnalyticsPeriod) {
    const TZ_OFFSET_MS = 7 * 60 * 60 * 1000;
    const nowVN = new Date(Date.now() + TZ_OFFSET_MS);

    // Tính since/until cho DB download query theo period (UTC+7)
    let since: Date;
    let until: Date | undefined;
    if (period === 'yesterday') {
      since = new Date(Date.UTC(nowVN.getUTCFullYear(), nowVN.getUTCMonth(), nowVN.getUTCDate() - 1));
      until = new Date(Date.UTC(nowVN.getUTCFullYear(), nowVN.getUTCMonth(), nowVN.getUTCDate()));
    } else if (period === 'day') {
      since = new Date(Date.UTC(nowVN.getUTCFullYear(), nowVN.getUTCMonth(), nowVN.getUTCDate()));
    } else if (period === 'week') {
      const daysFromMonday = (nowVN.getUTCDay() + 6) % 7;
      since = new Date(Date.UTC(nowVN.getUTCFullYear(), nowVN.getUTCMonth(), nowVN.getUTCDate() - daysFromMonday));
    } else if (period === 'month') {
      since = new Date(Date.UTC(nowVN.getUTCFullYear(), nowVN.getUTCMonth(), 1));
    } else {
      since = new Date(Date.UTC(nowVN.getUTCFullYear(), 0, 1));
    }

    // Download counts từ DB — group by date
    const downloadRaw = await this.prisma.appDownloadLog.findMany({
      where: { createdAt: { gte: since, ...(until ? { lt: until } : {}) } },
      select: { createdAt: true, platform: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group theo ngày UTC+7
    const dlByDate = new Map<string, number>();
    for (const d of downloadRaw) {
      const dateVN = new Date(d.createdAt.getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10);
      dlByDate.set(dateVN, (dlByDate.get(dateVN) ?? 0) + 1);
    }
    const dlPoints = Array.from(dlByDate.entries()).map(([date, count]) => ({ date, count }));

    // CF web analytics
    const [webRaw] = await Promise.all([
      this.cfAnalytics.fetchWebAnalytics(period),
    ]);

    const dlGrouped = this.cfAnalytics.groupDownloadPoints(dlPoints, period);

    return {
      configured: this.cfAnalytics.configured,
      period,
      web: webRaw ?? { visitors: 0, pageViews: 0, requests: 0, byDay: [] },
      app: {
        total: downloadRaw.length,
        byDay: dlGrouped,
      },
    };
  }
}
