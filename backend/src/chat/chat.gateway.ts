import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

// PHẢI CÓ: cors: { origin: '*' } ở đây
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('sendMessage')
  handleMessage(@MessageBody() data: any): void {
    // Gửi lại tin nhắn cho tất cả mọi người
    this.server.emit('receive_message', data);
  }
}