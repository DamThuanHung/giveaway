import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

const corsOrigin = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) ?? true;

@WebSocketGateway({ cors: { origin: corsOrigin } })
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) client.join(`user:${userId}`);
  }

  sendToUser(userId: string, unreadCount: number) {
    this.server.to(`user:${userId}`).emit('unread_count', { count: unreadCount });
  }
}
