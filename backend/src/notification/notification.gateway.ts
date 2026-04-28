import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

const corsOrigin = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) ?? true;

@WebSocketGateway({ cors: { origin: corsOrigin } })
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    // Lấy token từ auth/query/header — query là tin cậy nhất qua WS-only transport
    const token = (client.handshake.auth?.token as string)
      ?? (client.handshake.query?.token as string)
      ?? (client.handshake.headers?.authorization as string | undefined)?.replace(/^Bearer\s+/i, '');

    if (!token) {
      this.logger.warn(`Notification socket ${client.id} rejected: no token`);
      client.disconnect(true);
      return;
    }

    let userId: string;
    try {
      const payload = this.jwt.verify(token, { secret: process.env.JWT_SECRET });
      userId = payload.sub as string;
    } catch (err) {
      this.logger.warn(`Notification socket ${client.id} rejected: invalid token (${(err as Error).message})`);
      client.disconnect(true);
      return;
    }

    // Re-check isBanned mỗi lần connect — JWT sống 7 ngày, admin ban user xong
    // mà gateway chỉ verify signature → user vẫn duy trì WS đến khi token expire.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true },
    });
    if (!user || user.isBanned) {
      this.logger.warn(`Notification socket ${client.id} rejected: user banned/missing`);
      client.disconnect(true);
      return;
    }

    // userId LẤY TỪ TOKEN, không từ client query — chống ai đó join room user khác
    client.data.userId = userId;
    client.join(`user:${userId}`);
  }

  sendToUser(userId: string, unreadCount: number) {
    this.server.to(`user:${userId}`).emit('unread_count', { count: unreadCount });
  }
}
