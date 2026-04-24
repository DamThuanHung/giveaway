import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ReviewService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async createReview(reviewerId: string, dealId: string, rating: number, comment?: string) {
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new BadRequestException('Rating phải là số nguyên từ 1 đến 5');
    }
    const cleanComment = comment ? String(comment).trim().slice(0, 1000) : undefined;

    const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Không tìm thấy deal');
    if (deal.status !== 'completed') throw new BadRequestException('Deal chưa hoàn thành');
    if (deal.requesterId !== reviewerId && deal.ownerId !== reviewerId) {
      throw new BadRequestException('Không có quyền đánh giá deal này');
    }

    const revieweeId = deal.requesterId === reviewerId ? deal.ownerId : deal.requesterId;

    const existing = await this.prisma.review.findUnique({
      where: { dealId_reviewerId: { dealId, reviewerId } },
    });
    if (existing) throw new BadRequestException('Bạn đã đánh giá giao dịch này rồi');

    const review = await this.prisma.review.create({
      data: { dealId, reviewerId, revieweeId, rating, comment: cleanComment },
      include: { reviewer: { select: { id: true, name: true, avatar: true } } },
    });

    // Tìm room để deep link vào chat
    const room = await this.prisma.chatRoom.findFirst({
      where: { postId: deal.postId, buyerId: deal.requesterId },
    });

    const reviewerName = (review.reviewer as any)?.name ?? 'Ai đó';
    const stars = '⭐'.repeat(rating);
    await this.notificationService.createNotification(
      revieweeId,
      'review',
      `${reviewerName} đã đánh giá bạn ${stars}`,
      comment ? `"${comment}"` : 'Họ đã để lại đánh giá sau giao dịch.',
      JSON.stringify({ roomId: room?.id, dealId }),
    );

    return review;
  }

  async hasReviewed(reviewerId: string, dealId: string) {
    const existing = await this.prisma.review.findUnique({
      where: { dealId_reviewerId: { dealId, reviewerId } },
    });
    return { hasReviewed: !!existing };
  }

  async getUserReviews(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { revieweeId: userId },
      include: { reviewer: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const avg = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return { reviews, averageRating: Math.round(avg * 10) / 10, totalReviews: reviews.length };
  }
}
