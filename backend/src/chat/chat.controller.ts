import { Body, Controller, Get, Param, Post, Query, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /** Lấy hoặc tạo room chat giữa buyer và seller — 1 phòng/cặp người dùng */
  @Post('room')
  @UseGuards(JwtAuthGuard)
  async getOrCreateRoom(
    @Request() req,
    @Body() body: {
      postId: string;
      sellerId: string;
      postTitle?: string;
      extraPosts?: { id: string; title: string }[];
    },
  ) {
    const buyerId = req.user.id;
    const hasExtra = body.extraPosts && body.extraPosts.length > 0;

    // Tìm phòng đã có giữa buyer-seller
    let room = await this.chatService.getRoomByBuyerSeller(buyerId, body.sellerId);

    if (!room) {
      // Chưa có → tạo mới
      room = await this.chatService.createRoom(body.postId, buyerId, body.sellerId);
    }

    if (hasExtra) {
      // Hỏi về nhiều sản phẩm cùng lúc → gửi tin hệ thống liệt kê tất cả
      const allTitles = [
        body.postTitle ?? 'Sản phẩm',
        ...body.extraPosts!.map((p) => p.title),
      ].join(', ');
      await this.chatService.sendSystemMessage(
        room.id,
        `📦 Đang hỏi về: ${allTitles}`,
        buyerId,
      );
    } else if (room.postId !== body.postId && body.postTitle) {
      // Đã có phòng, hỏi về 1 sản phẩm khác → gửi tin hệ thống
      await this.chatService.sendSystemMessage(
        room.id,
        `📦 Đang hỏi về: ${body.postTitle}`,
        buyerId,
      );
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
  getRoomById(@Param('roomId') roomId: string, @Request() req) {
    return this.chatService.getRoomById(roomId, req.user.id);
  }

  /** Lấy tin nhắn trong room. Query params:
   *   - limit (1-100, default 50)
   *   - before (id message cuối đã có) — cho infinite scroll lên trên
   */
  @Get('room/:roomId/messages')
  @UseGuards(JwtAuthGuard)
  getMessages(
    @Param('roomId') roomId: string,
    @Request() req,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.chatService.getMessages(roomId, req.user.id, {
      limit: limit ? parseInt(limit, 10) : undefined,
      before: before || undefined,
    });
  }

  /// Upload ảnh cho chat. Trả về URL public của ảnh trên MinIO.
  /// Frontend sau khi nhận URL → emit `sendMessage` qua WS với `imageUrl` set.
  /// Multipart field name: `image`. Max 5MB (cùng config với avatar upload).
  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('image', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadImage(@UploadedFile() file: any) {
    const url = await this.cloudinaryService.uploadBuffer(
      file.buffer, 'traotay/chat', file.mimetype,
    );
    return { url };
  }
}
