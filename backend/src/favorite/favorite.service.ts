import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { formatPost } from '../post/post.service';

@Injectable()
export class FavoriteService {
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService,
  ) {}

  // 1. Hàm thêm bài đăng vào mục yêu thích
  async addFavorite(userId: any, postId: any) {
    try {
      const result = await this.prisma.favorite.upsert({
        where: { userId_postId: { userId: String(userId), postId: String(postId) } },
        update: {},
        create: { userId: String(userId), postId: String(postId) },
      });

      // Gửi thông báo cho chủ bài đăng (không gửi nếu tự like bài mình)
      const [liker, post] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: String(userId) }, select: { name: true } }),
        this.prisma.post.findUnique({ where: { id: String(postId) }, select: { title: true, authorId: true } }),
      ]);
      if (post && post.authorId && post.authorId !== String(userId)) {
        this.notification.createNotification(
          post.authorId,
          'favorite',
          'Có người thích bài của bạn',
          `${liker?.name ?? 'Ai đó'} đã thêm "${post.title}" vào danh sách yêu thích`,
          JSON.stringify({ postId: String(postId) }),
        ).catch(() => {});
      }

      return result;
    } catch (error) {
      throw new BadRequestException('Không thể thêm vào yêu thích');
    }
  }

  // 2. Hàm xóa bài đăng khỏi mục yêu thích
  async removeFavorite(userId: any, postId: any) {
    try {
      return await this.prisma.favorite.delete({
        where: {
          userId_postId: {
            userId: String(userId),
            postId: String(postId),
          },
        },
      });
    } catch (error) {
      // Nếu không tìm thấy để xóa cũng không báo lỗi nặng
      return { message: 'Đã xóa hoặc không tồn tại' };
    }
  }

  // 3. Hàm lấy danh sách bài yêu thích của User
  async getFavorites(userId: any) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId: String(userId) },
      include: {
        post: true, // Lấy kèm thông tin chi tiết bài đăng
      },
      orderBy: { createdAt: 'desc' },
    });
    // Apply formatPost cho mỗi post — bù imageUrl + images normalize.
    // Trước fix 2026-05-08, favorite trả raw post → frontend PostCard
    // không có imageUrl → fallback 📦 placeholder.
    return favorites.map((f) => ({
      ...f,
      post: f.post ? formatPost(f.post) : null,
    }));
  }
}