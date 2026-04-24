import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async getRoomByBuyerSeller(buyerId: string, sellerId: string) {
    return this.prisma.chatRoom.findUnique({
      where: { buyerId_sellerId: { buyerId, sellerId } },
      include: {
        post: { select: { id: true, title: true, imageLabel: true } },
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async createRoom(postId: string, buyerId: string, sellerId: string) {
    // Validate: buyerId và sellerId khác nhau + post thuộc sellerId
    if (buyerId === sellerId) {
      throw new ForbiddenException('Không thể chat với chính mình');
    }
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post) throw new ForbiddenException('Bài đăng không tồn tại');
    if (post.authorId !== sellerId) {
      throw new ForbiddenException('Bài đăng không thuộc người bán này');
    }

    // Chặn nếu buyer/seller đã block nhau (2 chiều)
    const blocked = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: buyerId, blockedId: sellerId },
          { blockerId: sellerId, blockedId: buyerId },
        ],
      },
    });
    if (blocked) throw new ForbiddenException('Không thể tạo phòng chat (đã bị chặn)');

    return this.prisma.chatRoom.create({
      data: { postId, buyerId, sellerId },
      include: {
        post: { select: { id: true, title: true, imageLabel: true } },
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async sendSystemMessage(roomId: string, text: string, systemUserId: string) {
    return this.prisma.message.create({
      data: { roomId, senderId: systemUserId, text, isRead: true, metadata: 'system' },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async getMyRooms(userId: string) {
    const rooms = await this.prisma.chatRoom.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: {
        post: { select: { id: true, title: true, imageLabel: true } },
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: {
          select: {
            messages: { where: { senderId: { not: userId }, isRead: false } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rooms.map((r) => ({
      ...r,
      unreadCount: r._count.messages,
    }));
  }

  async sendMessage(roomId: string, senderId: string, text: string) {
    const [message, room] = await Promise.all([
      this.prisma.message.create({
        data: { roomId, senderId, text },
        include: { sender: { select: { id: true, name: true, avatar: true } } },
      }),
      this.prisma.chatRoom.update({
        where: { id: roomId },
        data: { updatedAt: new Date() },
        include: { post: { select: { title: true, imageLabel: true } } },
      }),
    ]);

    // Tạo notification + gửi FCM push cho người nhận
    const recipientId = room.buyerId === senderId ? room.sellerId : room.buyerId;
    const senderName = (message.sender as any)?.name ?? 'Ai đó';
    const postTitle = (room as any).post?.title ?? '';
    const postImageLabel = (room as any).post?.imageLabel ?? '';
    const notifBody = postTitle
      ? `Bạn nhận được tin nhắn mới từ "${senderName}" về bài viết "${postTitle}"`
      : `Bạn nhận được tin nhắn mới từ "${senderName}"`;
    await this.notificationService.createNotification(
      recipientId,
      'chat',
      `Tin nhắn mới từ ${senderName}`,
      notifBody,
      JSON.stringify({ roomId, postTitle, postImageLabel }),
    );

    return message;
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: {
        room: { OR: [{ buyerId: userId }, { sellerId: userId }] },
        senderId: { not: userId },
        isRead: false,
      },
    });
    return { count };
  }

  async markRoomAsRead(roomId: string, userId: string) {
    // Verify user là member của room trước khi mark — chống abuse ping DB
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { buyerId: true, sellerId: true },
    });
    if (!room || (room.buyerId !== userId && room.sellerId !== userId)) {
      throw new ForbiddenException('Không có quyền truy cập phòng chat này');
    }
    await this.prisma.message.updateMany({
      where: { roomId, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });
  }

  async getRoomById(roomId: string, userId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        post: { select: { id: true, title: true, imageLabel: true } },
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true } },
      },
    });
    if (!room || (room.buyerId !== userId && room.sellerId !== userId)) {
      throw new ForbiddenException('Bạn không có quyền truy cập phòng chat này');
    }
    return room;
  }

  async getMessages(roomId: string, userId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { buyerId: true, sellerId: true },
    });
    if (!room || (room.buyerId !== userId && room.sellerId !== userId)) {
      throw new ForbiddenException('Bạn không có quyền xem tin nhắn này');
    }
    return this.prisma.message.findMany({
      where: { roomId },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
