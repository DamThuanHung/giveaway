import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getRoom(postId: any, buyerId: any) {
    return this.prisma.chatRoom.findUnique({
      where: {
        postId_buyerId: { 
          postId: String(postId), 
          buyerId: String(buyerId) 
        },
      },
    });
  }

  async createRoom(postId: any, buyerId: any, sellerId: any) {
    return this.prisma.chatRoom.create({
      data: {
        postId: String(postId),
        buyerId: String(buyerId),
        sellerId: String(sellerId),
      },
    });
  }

  async sendMessage(roomId: any, senderId: any, text: string) {
    return this.prisma.message.create({
      data: {
        roomId: String(roomId),
        senderId: String(senderId),
        text,
      },
    });
  }

  async getMessages(roomId: any) {
    return this.prisma.message.findMany({
      where: { roomId: String(roomId) },
      orderBy: { createdAt: 'asc' },
    });
  }
}