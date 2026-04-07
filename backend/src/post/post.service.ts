import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const BASE_URL = process.env.BASE_URL || 'http://192.168.0.108:3800';

function buildImageUrl(imageLabel: string): string | null {
  if (!imageLabel) return null;
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
    listingType?: string;
    itemCategory?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { status: query.status || 'available' };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.province) where.province = { contains: query.province, mode: 'insensitive' };
    if (query.listingType) where.listingType = query.listingType;
    if (query.itemCategory) where.itemCategory = query.itemCategory;
    if (query.minPrice !== undefined) where.price = { ...where.price, gte: query.minPrice };
    if (query.maxPrice !== undefined) where.price = { ...where.price, lte: query.maxPrice };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, name: true, avatar: true } } },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: posts.map(formatPost),
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

  async createPost(data: any, files: any[], userId?: string) {
    const priceStr = data.price ? data.price.toString().replace(/[^\d]/g, '') : '0';
    const parsedPrice = parseInt(priceStr, 10) || 0;
    const imageFilenames = files ? files.map((f) => f.filename) : [];

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
