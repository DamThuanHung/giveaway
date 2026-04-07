import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getRoom(postId: string, buyerId: string) {
    return this.prisma.chatRoom.findUnique({
      where: { postId_buyerId: { postId, buyerId } },
      include: {
        post: { select: { id: true, title: true, imageLabel: true } },
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async createRoom(postId: string, buyerId: string, sellerId: string) {
    return this.prisma.chatRoom.create({
      data: { postId, buyerId, sellerId },
      include: {
        post: { select: { id: true, title: true, imageLabel: true } },
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async getMyRooms(userId: string) {
    return this.prisma.chatRoom.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: {
        post: { select: { id: true, title: true, imageLabel: true } },
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
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
        include: { post: { select: { title: true } } },
      }),
    ]);

    // Tạo notification cho người nhận
    const recipientId = room.buyerId === senderId ? room.sellerId : room.buyerId;
    const senderName = (message.sender as any)?.name ?? 'Ai đó';
    await this.prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'chat',
        title: `Tin nhắn mới từ ${senderName}`,
        body: text.length > 60 ? text.substring(0, 60) + '...' : text,
        data: JSON.stringify({ roomId, postTitle: (room as any).post?.title }),
      },
    });

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
    await this.prisma.message.updateMany({
      where: { roomId, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });
  }

  async getRoomById(roomId: string) {
    return this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        post: { select: { id: true, title: true, imageLabel: true } },
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async getMessages(roomId: string) {
    return this.prisma.message.findMany({
      where: { roomId },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
