import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class DealService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async createDeal(requesterId: string, postId: string, userMessage?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { author: { select: { id: true, name: true } } },
    });
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng');
    if (post.authorId === requesterId) throw new BadRequestException('Không thể gửi yêu cầu cho bài đăng của mình');
    if (post.status !== 'available') throw new BadRequestException('Bài đăng này không còn nhận yêu cầu');

    const existing = await this.prisma.deal.findFirst({ where: { postId, requesterId, status: 'pending' } });
    if (existing) throw new BadRequestException('Bạn đã gửi yêu cầu cho bài đăng này rồi');

    const ownerId = post.authorId!;

    // Tạo deal
    const deal = await this.prisma.deal.create({
      data: { postId, requesterId, ownerId, message: userMessage },
      include: {
        post: { select: { id: true, title: true } },
        requester: { select: { id: true, name: true } },
      },
    });

    // Tạo hoặc lấy chat room
    let room = await this.prisma.chatRoom.findUnique({
      where: { postId_buyerId: { postId, buyerId: requesterId } },
    });
    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: { postId, buyerId: requesterId, sellerId: ownerId },
      });
    }

    // Gửi deal card message (senderId = requesterId, system message)
    const metadata = JSON.stringify({
      type: 'deal',
      dealId: deal.id,
      status: 'pending',
      userMessage: userMessage || null,
      postTitle: post.title,
    });
    await this.prisma.message.create({
      data: {
        roomId: room.id,
        senderId: requesterId,
        text: userMessage || 'Tôi muốn nhận món này',
        metadata,
      },
    });
    await this.prisma.chatRoom.update({ where: { id: room.id }, data: { updatedAt: new Date() } });

    // Notification cho người bán
    const requesterName = (deal.requester as any)?.name ?? 'Ai đó';
    await this.notificationService.createNotification(
      ownerId,
      'deal',
      `${requesterName} muốn nhận đồ của bạn`,
      `"${post.title}"${userMessage ? ` — "${userMessage}"` : ''}`,
      JSON.stringify({ roomId: room.id, dealId: deal.id }),
    );

    return { deal, roomId: room.id };
  }

  async getIncomingDeals(ownerId: string) {
    return this.prisma.deal.findMany({
      where: { ownerId },
      include: {
        post: { select: { id: true, title: true, imageLabel: true } },
        requester: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOutgoingDeals(requesterId: string) {
    return this.prisma.deal.findMany({
      where: { requesterId },
      include: {
        post: { select: { id: true, title: true, imageLabel: true } },
        owner: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateDealStatus(dealId: string, userId: string, status: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Không tìm thấy deal');

    const validOwnerStatuses = ['accepted', 'rejected', 'completed'];
    const validRequesterStatuses = ['cancelled'];

    if (validOwnerStatuses.includes(status) && deal.ownerId !== userId) throw new ForbiddenException('Không có quyền');
    if (validRequesterStatuses.includes(status) && deal.requesterId !== userId) throw new ForbiddenException('Không có quyền');

    const updated = await this.prisma.deal.update({ where: { id: dealId }, data: { status } });

    // Cập nhật metadata trong deal card message
    const dealMessage = await this.prisma.message.findFirst({
      where: { metadata: { contains: `"dealId":"${dealId}"` } },
    });
    if (dealMessage?.metadata) {
      const meta = JSON.parse(dealMessage.metadata);
      await this.prisma.message.update({
        where: { id: dealMessage.id },
        data: { metadata: JSON.stringify({ ...meta, status }) },
      });
    }

    if (status === 'accepted') {
      await this.prisma.post.update({ where: { id: deal.postId }, data: { status: 'reserved' } });
      await this.prisma.deal.updateMany({
        where: { postId: deal.postId, id: { not: dealId }, status: 'pending' },
        data: { status: 'rejected' },
      });
      // Notify người mua
      await this.notificationService.createNotification(
        deal.requesterId,
        'deal',
        'Yêu cầu được chấp nhận!',
        'Người bán đã đồng ý. Hãy liên hệ lại để sắp xếp thời gian và địa điểm giao dịch.',
        JSON.stringify({ dealId }),
      );
    }

    if (status === 'completed') {
      await this.prisma.post.update({ where: { id: deal.postId }, data: { status: 'done' } });
      const room = await this.prisma.chatRoom.findFirst({
        where: { postId: deal.postId, buyerId: deal.requesterId },
      });
      await this.notificationService.createNotification(
        deal.requesterId,
        'review',
        'Giao dịch hoàn thành!',
        'Hãy viết đánh giá cho người bán nhé.',
        JSON.stringify({ roomId: room?.id, dealId }),
      );
    }

    if (status === 'rejected') {
      await this.notificationService.createNotification(
        deal.requesterId,
        'deal',
        'Yêu cầu bị từ chối',
        'Người bán đã từ chối yêu cầu của bạn.',
        JSON.stringify({ dealId }),
      );
    }

    return updated;
  }
}
