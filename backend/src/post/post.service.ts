import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const BASE_URL = process.env.BASE_URL ?? '';

function buildImageUrl(imageLabel: string): string | null {
  if (!imageLabel) return null;
  // Nếu đã là URL đầy đủ (Cloudinary) thì trả về luôn
  if (imageLabel.startsWith('http')) return imageLabel;
  return `${BASE_URL}/uploads/${imageLabel}`;
}

function formatPost(post: any) {
  return {
    ...post,
    imageUrl: buildImageUrl(post.imageLabel),
  };
}

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async getAllPosts(query: {
    page?: number;
    limit?: number;
    search?: string;
    province?: string;
    provinces?: string[]; // filter theo nhiều tỉnh (Toàn miền X)
    listingType?: string;
    itemCategory?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    viewerId?: string;
    lat?: number;
    lng?: number;
    radius?: number; // km
    sortBy?: string; // newest | price_asc | price_desc
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { status: query.status ?? { in: ['available', 'reserved'] } };

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

    const orderBy: any =
      query.sortBy === 'price_asc' ? { price: 'asc' } :
      query.sortBy === 'price_desc' ? { price: 'desc' } :
      { createdAt: 'desc' };

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
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng');
    await this.prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return formatPost(post);
  }

  async getMyPosts(userId: string, status?: string) {
    const where: any = { authorId: userId };
    if (status) where.status = status;
    const posts = await this.prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return posts.map(formatPost);
  }

  async createPost(data: any, imageUrls: string[], userId?: string) {
    const priceStr = data.price ? data.price.toString().replace(/[^\d]/g, '') : '0';
    const parsedPrice = parseInt(priceStr, 10) || 0;
    const imageFilenames = imageUrls || [];

    return this.prisma.post.create({
      data: {
        title: data.title || 'Không tiêu đề',
        description: data.description || '',
        price: parsedPrice,
        latitude: parseFloat(data.latitude) || 0.0,
        longitude: parseFloat(data.longitude) || 0.0,
        itemCategory: data.itemCategory || 'other',
        province: data.province || '',
        district: data.district || '',
        ward: data.ward || '',
        addressDetail: data.addressDetail || '',
        listingType: data.listingType || 'sell',
        imageLabel: imageFilenames[0] || '',
        status: 'available',
        ...(userId ? { authorId: userId } : {}),
      },
    }).then(formatPost);
  }

  async updatePost(id: string, userId: string, data: any) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng');
    if (post.authorId !== userId) throw new ForbiddenException('Không có quyền sửa bài này');

    const validStatuses = ['available', 'reserved', 'done'];
    return this.prisma.post.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.price !== undefined && { price: parseInt(data.price) || 0 }),
        ...(data.province && { province: data.province }),
        ...(data.district && { district: data.district }),
        ...(data.ward && { ward: data.ward }),
        ...(data.addressDetail && { addressDetail: data.addressDetail }),
        ...(data.listingType && { listingType: data.listingType }),
        ...(data.itemCategory && { itemCategory: data.itemCategory }),
        ...(data.status && validStatuses.includes(data.status) && { status: data.status }),
      },
    }).then(formatPost);
  }

  async updateStatus(id: string, userId: string, status: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng');
    if (post.authorId !== userId) throw new ForbiddenException('Không có quyền');
    return this.prisma.post.update({ where: { id }, data: { status } }).then(formatPost);
  }

  async deletePost(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng');
    if (post.authorId !== userId) throw new ForbiddenException('Không có quyền xóa bài này');
    return this.prisma.post.delete({ where: { id } });
  }

  async getMyStats(userId: string) {
    const [totalPosts, availablePosts, donePosts, totalViews, totalFavorites, totalDeals] =
      await Promise.all([
        this.prisma.post.count({ where: { authorId: userId } }),
        this.prisma.post.count({ where: { authorId: userId, status: 'available' } }),
        this.prisma.post.count({ where: { authorId: userId, status: 'done' } }),
        this.prisma.post.aggregate({ where: { authorId: userId }, _sum: { viewCount: true } }),
        this.prisma.favorite.count({
          where: { post: { authorId: userId } },
        }),
        this.prisma.deal.count({ where: { ownerId: userId } }),
      ]);

    return {
      posts: { total: totalPosts, available: availablePosts, done: donePosts },
      totalViews: totalViews._sum.viewCount || 0,
      totalFavorites,
      totalDeals,
    };
  }
}
