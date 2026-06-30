import { BadRequestException, Injectable, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { KeywordAlertService } from '../keyword-alert/keyword-alert.service';

const BASE_URL = process.env.BASE_URL ?? '';

// Whitelist — không tin string từ client.
// MUST khớp với app/lib/data/categories.dart `AppCategories.list`.
// Lịch sử: backend cũ chỉ có 14 mục với các key sai (`fashion`/`home`/`services`)
// → Flutter gửi đúng `clothing`/`furniture`/`kitchen`/`service` bị silently rewrite
// thành `other` ở dòng cuối validate. Hậu quả: bài "Áo Zara" lưu DB là `other`.
// Đã sync lên 18 mục đúng Flutter — kèm SQL migration `migrate-categories-2026.sql`
// để convert data cũ trong production DB.
const VALID_POST_STATUSES = ['available', 'reserved', 'done', 'hidden', 'archived'] as const;
// Status do admin set khi soft-delete bài. KHÔNG bao giờ được expose ra public listing.
const DELETED_BY_ADMIN_STATUS = 'deleted_by_admin';
const VALID_ITEM_CATEGORIES = [
  'electronics', 'furniture', 'clothing', 'kitchen', 'books', 'toys',
  'sports', 'vehicles', 'beauty', 'pets', 'tools', 'food', 'baby',
  'music', 'realestate', 'service', 'jobs', 'other',
] as const;
// Frontend chỉ có 2 option `sell` và `give` (xem create_post_tab + edit_post_screen).
// Trước đây whitelist còn `free` + `exchange` → DB có thể chứa 2 giá trị này từ
// API trực tiếp → DropdownButton edit screen crash khi không có item match.
// Đã thu hẹp xuống 2 đúng với UI.
const VALID_LISTING_TYPES = ['sell', 'give'] as const;
const VALID_POST_TYPES = ['item', 'realestate', 'service', 'job'] as const;

const MAX_TITLE_LEN = 120;
const MAX_DESC_LEN = 5000;

function buildImageUrl(imageLabel: string): string | null {
  if (!imageLabel) return null;
  // Nếu đã là URL đầy đủ (Cloudinary) thì trả về luôn
  if (imageLabel.startsWith('http')) return imageLabel;
  return `${BASE_URL}/uploads/${imageLabel}`;
}

// Trả về mốc 00:00 của ngày VN (múi giờ +7) tại thời điểm `d`, biểu diễn dưới
// dạng UTC Date. Dùng cho PostView aggregate (ADR-0010) — bảo đảm "Hôm nay"
// theo VN khớp với period filter admin dashboard. Cùng thuật toán với
// `computeSince` trong admin.service.ts để giữ tính nhất quán.
export function vnDayStartUtc(d: Date = new Date()): Date {
  const TZ_OFFSET_MS = 7 * 60 * 60 * 1000;
  const vn = new Date(d.getTime() + TZ_OFFSET_MS);
  const vnMidnight = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()));
  return new Date(vnMidnight.getTime() - TZ_OFFSET_MS);
}

// Export để các service khác (favorite, follow, ...) tái sử dụng — đảm bảo
// imageUrl computed nhất quán mọi endpoint trả Post object. Sự cố
// 2026-05-08: /favorite trả raw post không qua formatPost → frontend
// PostCard fallback 📦 placeholder.
export function formatPost(post: any) {
  const images = post.images && post.images.length > 0
    ? post.images
    : (post.imageLabel ? [buildImageUrl(post.imageLabel)].filter(Boolean) : []);
  return {
    ...post,
    imageUrl: images[0] ?? buildImageUrl(post.imageLabel),
    images,
  };
}

@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService,
    private keywordAlert: KeywordAlertService,
  ) {}

  async getAllPosts(query: {
    page?: number;
    limit?: number;
    search?: string;
    province?: string;
    provinces?: string[]; // filter theo nhiều tỉnh (Toàn miền X)
    listingType?: string;
    itemCategory?: string;
    postType?: string; // item | realestate | service | job
    subType?: string;  // jobs: full-time|part-time|freelance|intern|remote
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    viewerId?: string;
    lat?: number;
    lng?: number;
    radius?: number; // km
    sortBy?: string; // newest | price_asc | price_desc
  }) {
    const page = Math.max(1, query.page || 1);
    // Cap limit để chống N+1 / OOM khi client request limit=10000.
    const limit = Math.min(Math.max(1, query.limit || 20), 100);
    const skip = (page - 1) * limit;

    // Public listing không bao giờ trả bài bị admin xóa, dù caller pass status nào.
    if (query.status === DELETED_BY_ADMIN_STATUS) {
      return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
    }
    const where: any = {
      status: query.status ?? { in: ['available', 'reserved'] },
      NOT: { status: DELETED_BY_ADMIN_STATUS },
    };

    // Lọc bài của người bị chặn bởi viewer
    if (query.viewerId) {
      const blocked = await this.prisma.blockedUser.findMany({
        where: { blockerId: query.viewerId },
        select: { blockedId: true },
      });
      const blockedIds = blocked.map(b => b.blockedId);
      if (blockedIds.length > 0) {
        where.authorId = { notIn: blockedIds };
      }
    }

    if (query.search) {
      // Dùng f_unaccent để tìm kiếm không phân biệt dấu tiếng Việt
      // "giay the thao" → tìm được "Giày Thể Thao"
      const searchPattern = `%${query.search}%`;
      const matchingIds = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Post"
        WHERE f_unaccent(lower(title)) LIKE f_unaccent(lower(${searchPattern}))
           OR f_unaccent(lower(description)) LIKE f_unaccent(lower(${searchPattern}))
      `;
      const ids = matchingIds.map(r => r.id);
      where.id = { in: ids.length > 0 ? ids : ['__no_match__'] };
    }
    if (query.provinces && query.provinces.length > 0) {
      where.province = { in: query.provinces };
    } else if (query.province) {
      where.province = { contains: query.province, mode: 'insensitive' };
    }
    if (query.listingType) where.listingType = query.listingType;
    if (query.itemCategory) where.itemCategory = query.itemCategory;
    if (query.postType) where.postType = query.postType;
    if (query.subType) where.subType = query.subType;
    if (query.minPrice !== undefined) where.price = { ...where.price, gte: query.minPrice };
    if (query.maxPrice !== undefined) where.price = { ...where.price, lte: query.maxPrice };

    // Nếu có lat/lng/radius → thêm bounding box filter trước
    if (query.lat !== undefined && query.lng !== undefined && query.radius) {
      const R = 6371; // km
      const latDelta = query.radius / R * (180 / Math.PI);
      const lngDelta = query.radius / (R * Math.cos(query.lat * Math.PI / 180)) * (180 / Math.PI);
      where.latitude = { gte: query.lat - latDelta, lte: query.lat + latDelta };
      where.longitude = { gte: query.lng - lngDelta, lte: query.lng + lngDelta };
    }

    // Sort 3 tầng cho default (newest):
    // 1. boostTier DESC → VIP(3) > Plus(2) > Standard(0). Tier tuyệt đối:
    //    Plus dù bump mới hơn cũng KHÔNG vượt được VIP.
    // 2. bumpedAt DESC nulls last → trong cùng tier, ai bump mới hơn lên trước.
    // 3. createdAt DESC → fallback theo ngày đăng.
    // Sort theo giá: bỏ qua tier để user filter giá thấy đủ kết quả.
    const orderBy: any =
      query.sortBy === 'price_asc' ? { price: 'asc' } :
      query.sortBy === 'price_desc' ? { price: 'desc' } :
      [
        { boostTier: 'desc' },
        { bumpedAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ];

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { author: { select: { id: true, name: true, avatar: true } } },
      }),
      this.prisma.post.count({ where }),
    ]);

    // Lọc chính xác theo Haversine nếu có radius
    let filtered = posts;
    if (query.lat !== undefined && query.lng !== undefined && query.radius) {
      filtered = posts.filter(p => {
        if (!p.latitude || !p.longitude) return false;
        const dLat = (p.latitude - query.lat!) * Math.PI / 180;
        const dLng = (p.longitude - query.lng!) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(query.lat! * Math.PI / 180) * Math.cos(p.latitude * Math.PI / 180) *
          Math.sin(dLng / 2) ** 2;
        const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return dist <= query.radius!;
      });
    }

    const resultPosts = (query.lat !== undefined && query.radius) ? filtered : posts;
    return {
      data: resultPosts.map(formatPost),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPostById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, avatar: true, createdAt: true } } },
    });
    if (!post || post.status === DELETED_BY_ADMIN_STATUS) {
      throw new NotFoundException('Không tìm thấy bài đăng');
    }
    const today = vnDayStartUtc();
    await Promise.all([
      this.prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } }),
      // PostView aggregate theo VN day boundary — ADR-0010.
      // Upsert race-safe: 2 view cùng lúc → 1 create + 1 increment.
      this.prisma.postView.upsert({
        where: { postId_date: { postId: id, date: today } },
        create: { postId: id, date: today, count: 1 },
        update: { count: { increment: 1 } },
      }).catch(() => { /* swallow — view tracking không được làm crash request */ }),
    ]);
    return formatPost(post);
  }

  async getMyPosts(userId: string, status?: string) {
    // User không được thấy bài bị admin xóa trong profile của mình.
    if (status === DELETED_BY_ADMIN_STATUS) return [];
    const where: any = { authorId: userId, NOT: { status: DELETED_BY_ADMIN_STATUS } };
    if (status) where.status = status;
    const posts = await this.prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return posts.map(formatPost);
  }

  async createPost(data: any, imageUrls: string[], userId?: string) {
    if (!userId) throw new UnauthorizedException('Cần đăng nhập');

    // Defense-in-depth: JWT có thể chưa hết hạn dù user đã bị ban
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { isBanned: true } });
    if (!user) throw new UnauthorizedException('User không tồn tại');
    if (user.isBanned) throw new ForbiddenException('Tài khoản đã bị khóa');

    // Validate + clamp inputs
    const title = String(data.title ?? '').trim().slice(0, MAX_TITLE_LEN) || 'Không tiêu đề';
    const description = String(data.description ?? '').trim().slice(0, MAX_DESC_LEN);
    const itemCategory = VALID_ITEM_CATEGORIES.includes(data.itemCategory)
      ? data.itemCategory : 'other';
    const listingType = VALID_LISTING_TYPES.includes(data.listingType)
      ? data.listingType : 'sell';
    const postType = VALID_POST_TYPES.includes(data.postType) ? data.postType : 'item';

    const priceStr = data.price ? data.price.toString().replace(/[^\d]/g, '') : '0';
    const parsedPrice = parseInt(priceStr, 10) || 0;
    const urls = imageUrls || [];

    const post = await this.prisma.post.create({
      data: {
        title,
        description,
        price: parsedPrice,
        latitude: parseFloat(data.latitude) || 0.0,
        longitude: parseFloat(data.longitude) || 0.0,
        itemCategory,
        province: String(data.province ?? '').slice(0, 50),
        district: String(data.district ?? '').slice(0, 50),
        ward: String(data.ward ?? '').slice(0, 50),
        addressDetail: String(data.addressDetail ?? '').slice(0, 200),
        listingType,
        imageLabel: urls[0] || '',
        images: urls,
        status: 'available',
        postType,
        ...(data.subType && { subType: String(data.subType).slice(0, 50) }),
        ...(data.area !== undefined && data.area !== '' && { area: parseFloat(data.area) || null }),
        ...(data.bedrooms !== undefined && data.bedrooms !== '' && { bedrooms: parseInt(data.bedrooms) || null }),
        ...(data.priceUnit && { priceUnit: String(data.priceUnit).slice(0, 20) }),
        ...(data.serviceArea && { serviceArea: String(data.serviceArea).slice(0, 200) }),
        authorId: userId,
      },
    });

    // PM1 (Tier 4): Notification fan-out với batch processing.
    // Trước đây Promise.all parallel cho ALL followers → user 5K followers
    // → 5K parallel DB calls → connection pool exhaustion (default 10 conns).
    // Giờ batch chunks 50, sequential giữa các batch với delay 100ms.
    if (userId) {
      this.prisma.follow.findMany({ where: { followingId: userId }, select: { followerId: true } })
        .then(async (follows) => {
          if (follows.length === 0) return;
          const author = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
          const authorName = author?.name ?? 'Ai đó';
          // Giảm từ 50 → 10: tránh 50 parallel DB writes saturate connection pool (size 10).
          // Delay 100ms → 200ms: cho event loop xử lý request khác giữa các batch.
          const BATCH_SIZE = 10;
          for (let i = 0; i < follows.length; i += BATCH_SIZE) {
            const batch = follows.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(f =>
              this.notification.createNotification(
                f.followerId,
                'new_post',
                'Bài đăng mới từ người bạn theo dõi',
                `${authorName} vừa đăng: "${post.title}"`,
                JSON.stringify({ postId: post.id }),
              ).catch(() => {}),
            ));
            if (i + BATCH_SIZE < follows.length) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
        }).catch(() => {});
    }

    // Thông báo keyword alert
    this.keywordAlert.notifyMatchingUsers(post.id, post.title, post.description, userId ?? '').catch(() => {});

    return formatPost(post);
  }

  async updatePost(id: string, userId: string, data: any) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng');
    if (post.authorId !== userId) throw new ForbiddenException('Không có quyền sửa bài này');

    // Validate images: array of URLs, mỗi URL ≤ 500 chars, max 10 ảnh.
    let imagesPayload: string[] | undefined;
    if (Array.isArray(data.images)) {
      const filtered: string[] = (data.images as any[])
        .filter((u: any) => typeof u === 'string' && u.length > 0 && u.length <= 500)
        .slice(0, 10);
      if (filtered.length === 0) {
        throw new BadRequestException('Bài đăng phải có ít nhất 1 ảnh');
      }
      imagesPayload = filtered;
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        ...(data.title && { title: String(data.title).trim().slice(0, MAX_TITLE_LEN) }),
        ...(data.description !== undefined && { description: String(data.description).trim().slice(0, MAX_DESC_LEN) }),
        ...(data.price !== undefined && { price: parseInt(data.price) || 0 }),
        ...(data.province && { province: String(data.province).slice(0, 50) }),
        ...(data.district && { district: String(data.district).slice(0, 50) }),
        ...(data.ward && { ward: String(data.ward).slice(0, 50) }),
        ...(data.addressDetail && { addressDetail: String(data.addressDetail).slice(0, 200) }),
        ...(data.listingType && VALID_LISTING_TYPES.includes(data.listingType) && { listingType: data.listingType }),
        ...(data.itemCategory && VALID_ITEM_CATEGORIES.includes(data.itemCategory) && { itemCategory: data.itemCategory }),
        // Sửa ảnh: nhận full list URLs từ client (existing giữ + new đã upload xong).
        // Set imageLabel = ảnh đầu tiên cho compatibility với code cũ build URL từ label.
        ...(imagesPayload !== undefined ? {
          images: imagesPayload,
          imageLabel: imagesPayload[0],
        } : {}),
        // status update phải qua endpoint /status riêng (deal state machine có thể phụ thuộc)
      },
    }).then(formatPost);
  }

  async updateStatus(id: string, userId: string, status: string) {
    if (!VALID_POST_STATUSES.includes(status as any)) {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }
    // 'done' phải đi qua completePost() để có completedWithUserId — chống bypass
    if (status === 'done') {
      throw new BadRequestException('Dùng /post/:id/complete để đánh dấu hoàn thành');
    }
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng');
    if (post.authorId !== userId) throw new ForbiddenException('Không có quyền');
    return this.prisma.post.update({ where: { id }, data: { status } }).then(formatPost);
  }

  /**
   * Author đánh dấu bài đã hoàn thành giao dịch với partner cụ thể.
   * Idempotent: nếu đã 'done' rồi thì return luôn không lỗi.
   * Partner phải đã từng chat về bài này (chống fake — author tự chọn user random).
   */
  async completePost(id: string, userId: string, partnerId: string) {
    if (!partnerId || typeof partnerId !== 'string') {
      throw new BadRequestException('Thiếu thông tin đối tác giao dịch');
    }
    if (partnerId === userId) {
      throw new BadRequestException('Không thể giao dịch với chính mình');
    }

    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng');
    if (post.authorId !== userId) {
      throw new ForbiddenException('Chỉ chủ bài đăng mới có quyền đánh dấu hoàn thành');
    }

    // Idempotent: nếu đã hoàn thành với cùng partner → return luôn
    if (post.status === 'done' && post.completedWithUserId === partnerId) {
      return formatPost(post);
    }
    if (post.status === 'done') {
      throw new BadRequestException('Bài đăng đã được đánh dấu hoàn thành');
    }
    if (post.status !== 'available' && post.status !== 'reserved') {
      throw new BadRequestException('Chỉ đánh dấu hoàn thành được khi bài còn hoạt động');
    }

    // Verify partner đã từng chat về bài này (chống author chọn random user)
    const room = await this.prisma.chatRoom.findFirst({
      where: { postId: id, OR: [{ buyerId: partnerId }, { sellerId: partnerId }] },
    });
    if (!room) {
      throw new BadRequestException('Đối tác giao dịch phải đã từng chat về bài này');
    }

    const partner = await this.prisma.user.findUnique({
      where: { id: partnerId },
      select: { id: true, name: true },
    });
    if (!partner) throw new NotFoundException('Không tìm thấy đối tác');

    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        status: 'done',
        completedWithUserId: partnerId,
        completedAt: new Date(),
      },
    });

    // Notify partner — best effort, không block flow chính nếu fail
    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    this.notification.createNotification(
      partnerId,
      'transaction_completed',
      `${author?.name ?? 'Đối tác'} đã xác nhận giao dịch xong`,
      `Hãy đánh giá ${author?.name ?? 'họ'} để cộng đồng tin tưởng hơn nhé!`,
      JSON.stringify({ postId: id, partnerId: userId, action: 'review' }),
    ).catch((err) => {
      // log nhưng không throw — notification fail không nên block transaction complete
      console.error('completePost notification failed:', err);
    });

    return formatPost(updated);
  }

  async deletePost(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng');
    if (post.authorId !== userId) throw new ForbiddenException('Không có quyền xóa bài này');
    return this.prisma.post.delete({ where: { id } });
  }

  async bumpPost(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng');
    if (post.authorId !== userId) throw new ForbiddenException('Không có quyền đẩy bài này');
    if (post.status !== 'available') throw new BadRequestException('Chỉ có thể đẩy bài đang còn hàng');

    if (post.bumpedAt) {
      const hoursSince = (Date.now() - post.bumpedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        const remainingHours = Math.ceil(24 - hoursSince);
        throw new BadRequestException(`Còn ${remainingHours} giờ nữa mới được đẩy lại`);
      }
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: { bumpedAt: new Date() },
    });
    const nextBumpAt = new Date(updated.bumpedAt!.getTime() + 24 * 60 * 60 * 1000);
    return { ok: true, bumpedAt: updated.bumpedAt, nextBumpAt };
  }

  async getMyStats(userId: string) {
    // Gộp 4 query (total/available/done count + view sum) thành 1 groupBy —
    // Prisma groupBy hỗ trợ _count + _sum cùng lúc theo từng status.
    const [byStatus, totalFavorites] = await Promise.all([
      this.prisma.post.groupBy({
        by: ['status'],
        where: { authorId: userId },
        _count: true,
        _sum: { viewCount: true },
      }),
      this.prisma.favorite.count({
        where: { post: { authorId: userId } },
      }),
    ]);

    const totalPosts = byStatus.reduce((sum, g) => sum + g._count, 0);
    const availablePosts = byStatus.find((g) => g.status === 'available')?._count ?? 0;
    const donePosts = byStatus.find((g) => g.status === 'done')?._count ?? 0;
    const totalViews = byStatus.reduce((sum, g) => sum + (g._sum.viewCount ?? 0), 0);

    return {
      posts: { total: totalPosts, available: availablePosts, done: donePosts },
      totalViews,
      totalFavorites,
      totalCompleted: donePosts, // alias rõ nghĩa: số giao dịch hoàn thành
    };
  }
}
