import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService, private chatService: ChatService) {}

  async createReview(reviewerId: string, dealId: string, rating: number, comment?: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Không tìm thấy deal');
    if (deal.status !== 'completed') throw new BadRequestException('Deal chưa hoàn thành');
    if (deal.requesterId !== reviewerId && deal.ownerId !== reviewerId) throw new BadRequestException('Không có quyền đánh giá deal này');

    const revieweeId = deal.requesterId === reviewerId ? deal.ownerId : deal.requesterId;

    const review = await this.prisma.review.create({
      data: { dealId, reviewerId, revieweeId, rating, comment },
      include: { reviewer: { select: { id: true, name: true, avatar: true } } },
    });

    // Tìm room để deep link vào chat
    const room = await this.prisma.chatRoom.findFirst({
      where: { postId: deal.postId, buyerId: deal.requesterId },
    });

    const reviewerName = (review.reviewer as any)?.name ?? 'Ai đó';
    const stars = '⭐'.repeat(rating);
    await this.prisma.notification.create({
      data: {
        userId: revieweeId,
        type: 'review',
        title: `${reviewerName} đã đánh giá bạn ${stars}`,
        body: comment ? `"${comment}"` : 'Họ đã để lại đánh giá sau giao dịch.',
        data: JSON.stringify({ roomId: room?.id, dealId }),
      },
    });

    return review;
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
