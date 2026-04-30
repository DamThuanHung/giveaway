import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ReviewService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Tạo review cho 1 bài đăng đã hoàn thành (post.status='done').
   * Author đánh giá partner, partner đánh giá author — 2-chiều.
   * 1 user chỉ review 1 bài 1 lần (unique [postId, reviewerId]).
   * Cho edit trong 24h sau submit (xem updateReview).
   */
  async createReview(reviewerId: string, postId: string, rating: number, comment?: string) {
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new BadRequestException('Rating phải là số nguyên từ 1 đến 5');
    }
    const cleanComment = comment ? String(comment).trim().slice(0, 1000) : undefined;

    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng');
    if (post.status !== 'done') {
      throw new BadRequestException('Chỉ đánh giá được sau khi giao dịch hoàn tất');
    }
    if (!post.completedWithUserId) {
      throw new BadRequestException('Bài đăng thiếu thông tin đối tác giao dịch');
    }

    // Reviewer phải là 1 trong 2 bên (author hoặc partner)
    const isAuthor = post.authorId === reviewerId;
    const isPartner = post.completedWithUserId === reviewerId;
    if (!isAuthor && !isPartner) {
      throw new ForbiddenException('Bạn không có quyền đánh giá giao dịch này');
    }

    // Xác định reviewee = bên còn lại
    const revieweeId = isAuthor ? post.completedWithUserId : post.authorId!;

    const existing = await this.prisma.review.findUnique({
      where: { postId_reviewerId: { postId, reviewerId } },
    });
    if (existing) throw new BadRequestException('Bạn đã đánh giá giao dịch này rồi');

    const review = await this.prisma.review.create({
      data: { postId, reviewerId, revieweeId, rating, comment: cleanComment },
      include: { reviewer: { select: { id: true, name: true, avatar: true } } },
    });

    // Notify reviewee
    const room = await this.prisma.chatRoom.findFirst({
      where: { postId, OR: [{ buyerId: revieweeId }, { sellerId: revieweeId }] },
    });
    const reviewerName = (review.reviewer as any)?.name ?? 'Ai đó';
    const stars = '⭐'.repeat(rating);
    await this.notificationService.createNotification(
      revieweeId,
      'review',
      `${reviewerName} đã đánh giá bạn ${stars}`,
      comment ? `"${comment}"` : 'Họ đã để lại đánh giá sau giao dịch.',
      JSON.stringify({ roomId: room?.id, postId }),
    );

    return review;
  }

  /**
   * Sửa review trong 24h kể từ createdAt. Sau đó freeze (không cho sửa).
   */
  async updateReview(reviewerId: string, postId: string, rating: number, comment?: string) {
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new BadRequestException('Rating phải là số nguyên từ 1 đến 5');
    }
    const cleanComment = comment ? String(comment).trim().slice(0, 1000) : undefined;

    const review = await this.prisma.review.findUnique({
      where: { postId_reviewerId: { postId, reviewerId } },
    });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');

    const ageMs = Date.now() - review.createdAt.getTime();
    if (ageMs > 24 * 60 * 60 * 1000) {
      throw new BadRequestException('Chỉ được sửa đánh giá trong 24 giờ đầu');
    }

    return this.prisma.review.update({
      where: { id: review.id },
      data: { rating, comment: cleanComment },
    });
  }

  async hasReviewed(reviewerId: string, postId: string) {
    const existing = await this.prisma.review.findUnique({
      where: { postId_reviewerId: { postId, reviewerId } },
    });
    return { hasReviewed: !!existing, review: existing };
  }

  async getUserReviews(userId: string, page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { revieweeId: userId },
        include: {
          reviewer: { select: { id: true, name: true, avatar: true } },
          post: { select: { id: true, title: true, listingType: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.review.count({ where: { revieweeId: userId } }),
    ]);

    // Avg trên TOÀN BỘ reviews (không phải chỉ trang này)
    const allRatings = await this.prisma.review.findMany({
      where: { revieweeId: userId },
      select: { rating: true },
    });
    const avg = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
      : 0;

    return {
      reviews,
      total,
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: allRatings.length,
    };
  }
}
