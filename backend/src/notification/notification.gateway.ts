import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

const corsOrigin = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) ?? true;

@WebSocketGateway({ cors: { origin: corsOrigin } })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(NotificationGateway.name);

  // Track active sockets per userId — chống memory leak khi user reconnect nhiều
  // lần hoặc multi-device. Disconnect → remove khỏi map.
  private readonly userSockets = new Map<string, Set<string>>();

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

    // Track active socket
    if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
    this.userSockets.get(userId)!.add(client.id);
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId as string | undefined;
    if (!userId) return;
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    sockets.delete(client.id);
    if (sockets.size === 0) this.userSockets.delete(userId);
  }

  /**
   * Emit unread_count tới user. Wrap try-catch — emit fail KHÔNG block REST flow.
   * Memory: TM11 (Tier 2 audit) — silent emit failure → unread badge desync DB.
   */
  sendToUser(userId: string, unreadCount: number) {
    try {
      this.server.to(`user:${userId}`).emit('unread_count', { count: unreadCount });
    } catch (err) {
      this.logger.warn(`sendToUser failed for ${userId}: ${(err as Error).message}`);
    }
  }
}
