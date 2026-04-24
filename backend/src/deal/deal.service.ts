import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

// State machine — chỉ cho phép transitions hợp lệ.
// Tránh bug DB inconsistent (VD complete deal đã cancelled).
const VALID_STATUSES = ['pending', 'accepted', 'rejected', 'cancelled', 'completed'] as const;
type DealStatus = typeof VALID_STATUSES[number];

const ALLOWED_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  pending:   ['accepted', 'rejected', 'cancelled'],
  accepted:  ['completed', 'cancelled'],
  rejected:  [],  // terminal
  cancelled: [],  // terminal
  completed: [],  // terminal
};

// Ai được phép trigger status nào?
const OWNER_ACTIONS: DealStatus[]     = ['accepted', 'rejected', 'completed'];
const REQUESTER_ACTIONS: DealStatus[] = ['cancelled'];

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

    const ownerId = post.authorId!;

    // Chặn deal giữa 2 user đã block nhau (cả 2 chiều)
    const blocked = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: ownerId, blockedId: requesterId },
          { blockerId: requesterId, blockedId: ownerId },
        ],
      },
    });
    if (blocked) throw new ForbiddenException('Không thể gửi yêu cầu (đã bị chặn)');

    const existing = await this.prisma.deal.findFirst({ where: { postId, requesterId, status: 'pending' } });
    if (existing) throw new BadRequestException('Bạn đã gửi yêu cầu cho bài đăng này rồi');

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
      where: { buyerId_sellerId: { buyerId: requesterId, sellerId: ownerId } },
    });
    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: { postId, buyerId: requesterId, sellerId: ownerId },
      });
    }

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

  async updateDealStatus(dealId: string, userId: string, newStatus: string) {
    // Validate status enum (không tin string từ client)
    if (!VALID_STATUSES.includes(newStatus as DealStatus)) {
      throw new BadRequestException('Status không hợp lệ');
    }
    const targetStatus = newStatus as DealStatus;

    const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Không tìm thấy deal');

    // Authorization — ai được làm gì
    if (OWNER_ACTIONS.includes(targetStatus) && deal.ownerId !== userId) {
      throw new ForbiddenException('Chỉ người bán mới có quyền này');
    }
    if (REQUESTER_ACTIONS.includes(targetStatus) && deal.requesterId !== userId) {
      throw new ForbiddenException('Chỉ người yêu cầu mới có quyền này');
    }

    // State machine — chỉ cho phép transition hợp lệ
    const currentStatus = deal.status as DealStatus;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Không thể chuyển từ "${currentStatus}" sang "${targetStatus}". Hợp lệ: ${allowed.join(', ') || '(không có — trạng thái cuối)'}`,
      );
    }

    // ═══ Transaction: update deal + post + reject other pending ═══
    // Đặt trong transaction để tránh race condition khi 2 người accept cùng lúc.
    await this.prisma.$transaction(async (tx) => {
      // Update deal status
      await tx.deal.update({ where: { id: dealId }, data: { status: targetStatus } });

      if (targetStatus === 'accepted') {
        // Chỉ accept khi post vẫn available (defense với race condition)
        const post = await tx.post.findUnique({ where: { id: deal.postId } });
        if (!post || post.status !== 'available') {
          throw new BadRequestException('Bài đăng đã được accept bởi người khác');
        }
        await tx.post.update({ where: { id: deal.postId }, data: { status: 'reserved' } });
        await tx.deal.updateMany({
          where: { postId: deal.postId, id: { not: dealId }, status: 'pending' },
          data: { status: 'rejected' },
        });
      }

      if (targetStatus === 'completed') {
        await tx.post.update({ where: { id: deal.postId }, data: { status: 'done' } });
      }

      // Khi cancel/reject deal đã accepted → reset post về available để nhận deal khác
      if ((targetStatus === 'cancelled' || targetStatus === 'rejected') && currentStatus === 'accepted') {
        await tx.post.update({ where: { id: deal.postId }, data: { status: 'available' } });
      }
    });

    // Cập nhật metadata trong deal card message (ngoài transaction — OK nếu fail)
    const dealMessage = await this.prisma.message.findFirst({
      where: { metadata: { contains: `"dealId":"${dealId}"` } },
    });
    if (dealMessage?.metadata) {
      const meta = JSON.parse(dealMessage.metadata);
      await this.prisma.message.update({
        where: { id: dealMessage.id },
        data: { metadata: JSON.stringify({ ...meta, status: targetStatus }) },
      });
    }

    // Notifications
    if (targetStatus === 'accepted') {
      await this.notificationService.createNotification(
        deal.requesterId,
        'deal',
        'Yêu cầu được chấp nhận!',
        'Người bán đã đồng ý. Hãy liên hệ lại để sắp xếp thời gian và địa điểm giao dịch.',
        JSON.stringify({ dealId }),
      );
    }
    if (targetStatus === 'completed') {
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
    if (targetStatus === 'rejected') {
      await this.notificationService.createNotification(
        deal.requesterId,
        'deal',
        'Yêu cầu bị từ chối',
        'Người bán đã từ chối yêu cầu của bạn.',
        JSON.stringify({ dealId }),
      );
    }
    if (targetStatus === 'cancelled') {
      // Requester cancel → notify owner
      await this.notificationService.createNotification(
        deal.ownerId,
        'deal',
        'Yêu cầu bị hủy',
        'Người yêu cầu đã hủy. Bài đăng của bạn đã mở lại để nhận yêu cầu khác.',
        JSON.stringify({ dealId }),
      );
    }

    return this.prisma.deal.findUnique({ where: { id: dealId } });
  }
}
