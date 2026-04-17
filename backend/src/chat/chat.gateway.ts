import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    const roomId = client.handshake.query.roomId as string;
    if (roomId) client.join(roomId);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
    client.join(data.roomId);
    return { event: 'joinedRoom', data: data.roomId };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; senderId: string; text: string },
  ) {
    const message = await this.chatService.sendMessage(data.roomId, data.senderId, data.text);
    this.server.to(data.roomId).emit('receive_message', message);
    // Khi gửi tin nhắn → tự động dừng typing
    client.to(data.roomId).emit('stop_typing', { senderId: data.senderId });
    return message;
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; senderId: string },
  ) {
    client.to(data.roomId).emit('typing', { senderId: data.senderId });
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; senderId: string },
  ) {
    client.to(data.roomId).emit('stop_typing', { senderId: data.senderId });
  }
}
