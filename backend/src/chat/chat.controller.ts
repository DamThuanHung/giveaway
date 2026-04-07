import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /** Lấy hoặc tạo room chat giữa buyer và seller cho 1 bài đăng */
  @Post('room')
  @UseGuards(JwtAuthGuard)
  async getOrCreateRoom(
    @Request() req,
    @Body() body: { postId: string; sellerId: string },
  ) {
    const buyerId = req.user.id;
    let room = await this.chatService.getRoom(body.postId, buyerId);
    if (!room) {
      room = await this.chatService.createRoom(body.postId, buyerId, body.sellerId);
    }
    return room;
  }

  /** Lấy danh sách rooms của user hiện tại */
  @Get('rooms')
  @UseGuards(JwtAuthGuard)
  getMyRooms(@Request() req) {
    return this.chatService.getMyRooms(req.user.id);
  }

  /** Số tin nhắn chưa đọc */
  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  getUnreadCount(@Request() req) {
    return this.chatService.getUnreadCount(req.user.id);
  }

  /** Đánh dấu đã đọc tất cả tin nhắn trong room */
  @Post('room/:roomId/read')
  @UseGuards(JwtAuthGuard)
  markRoomAsRead(@Param('roomId') roomId: string, @Request() req) {
    return this.chatService.markRoomAsRead(roomId, req.user.id);
  }

  /** Lấy thông tin room theo id */
  @Get('room/:roomId')
  @UseGuards(JwtAuthGuard)
  getRoomById(@Param('roomId') roomId: string) {
    return this.chatService.getRoomById(roomId);
  }

  /** Lấy tin nhắn trong room */
  @Get('room/:roomId/messages')
  @UseGuards(JwtAuthGuard)
  getMessages(@Param('roomId') roomId: string) {
    return this.chatService.getMessages(roomId);
  }
}
