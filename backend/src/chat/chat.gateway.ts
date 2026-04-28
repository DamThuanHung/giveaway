import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';

const corsOrigin = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) ?? true;

/**
 * Chat socket — xác thực qua JWT handshake.
 * Client phải truyền token khi connect: `IO.io(url, { auth: { token } })`.
 * Server lưu `userId` vào `client.data.userId` sau verify, KHÔNG BAO GIỜ tin
 * senderId/userId từ message body — chống impersonate.
 */
@WebSocketGateway({ cors: { origin: corsOrigin } })
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  handleConnection(client: Socket) {
    // Token có thể ở auth.token (Socket.IO v4), query.token (đáng tin cậy nhất
    // qua WebSocket-only transport — query luôn truyền), hoặc Authorization header
    // (chỉ hoạt động khi có polling transport).
    const token = (client.handshake.auth?.token as string)
      ?? (client.handshake.query?.token as string)
      ?? (client.handshake.headers?.authorization as string | undefined)?.replace(/^Bearer\s+/i, '');

    if (!token) {
      this.logger.warn(`Socket ${client.id} rejected: no token`);
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwt.verify(token, { secret: process.env.JWT_SECRET });
      client.data.userId = payload.sub as string;
    } catch (err) {
      this.logger.warn(`Socket ${client.id} rejected: invalid token (${(err as Error).message})`);
      client.disconnect(true);
      return;
    }

    const roomId = client.handshake.query.roomId as string | undefined;
    if (roomId) client.join(roomId);
  }

  /** User có quyền vào room này không? (là buyer hoặc seller) */
  private async canAccessRoom(roomId: string, userId: string): Promise<boolean> {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { buyerId: true, sellerId: true },
    });
    if (!room) return false;
    return room.buyerId === userId || room.sellerId === userId;
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = client.data.userId as string;
    if (!await this.canAccessRoom(data.roomId, userId)) {
      return { event: 'error', data: 'Không có quyền truy cập phòng chat' };
    }
    client.join(data.roomId);
    return { event: 'joinedRoom', data: data.roomId };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; text: string },
  ) {
    const userId = client.data.userId as string;
    if (!data?.text || typeof data.text !== 'string' || data.text.length > 2000) {
      return { event: 'error', data: 'Nội dung không hợp lệ' };
    }
    if (!await this.canAccessRoom(data.roomId, userId)) {
      return { event: 'error', data: 'Không có quyền gửi vào phòng chat này' };
    }

    // senderId LẤY TỪ TOKEN, không từ body — chống impersonate.
    const message = await this.chatService.sendMessage(data.roomId, userId, data.text);
    client.to(data.roomId).emit('receive_message', message);
    client.to(data.roomId).emit('stop_typing', { senderId: userId });
    return message;
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = client.data.userId as string;
    if (!await this.canAccessRoom(data.roomId, userId)) return;
    client.to(data.roomId).emit('typing', { senderId: userId });
  }

  @SubscribeMessage('stop_typing')
  async handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = client.data.userId as string;
    if (!await this.canAccessRoom(data.roomId, userId)) return;
    client.to(data.roomId).emit('stop_typing', { senderId: userId });
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = client.data.userId as string;
    if (!await this.canAccessRoom(data.roomId, userId)) return;

    await this.chatService.markRoomAsRead(data.roomId, userId);
    client.to(data.roomId).emit('messages_read', { roomId: data.roomId, readBy: userId });
  }
}
