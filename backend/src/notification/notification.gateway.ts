import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

const corsOrigin = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) ?? true;

@WebSocketGateway({ cors: { origin: corsOrigin } })
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(NotificationGateway.name);

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: Socket) {
    // Lấy token từ auth/query/header — query là tin cậy nhất qua WS-only transport
    const token = (client.handshake.auth?.token as string)
      ?? (client.handshake.query?.token as string)
      ?? (client.handshake.headers?.authorization as string | undefined)?.replace(/^Bearer\s+/i, '');

    if (!token) {
      this.logger.warn(`Notification socket ${client.id} rejected: no token`);
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwt.verify(token, { secret: process.env.JWT_SECRET });
      // userId LẤY TỪ TOKEN, không từ client query — chống ai đó join room user khác
      const userId = payload.sub as string;
      client.data.userId = userId;
      client.join(`user:${userId}`);
    } catch (err) {
      this.logger.warn(`Notification socket ${client.id} rejected: invalid token (${(err as Error).message})`);
      client.disconnect(true);
    }
  }

  sendToUser(userId: string, unreadCount: number) {
    this.server.to(`user:${userId}`).emit('unread_count', { count: unreadCount });
  }
}
