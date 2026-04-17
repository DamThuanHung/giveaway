import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getAll(@Request() req) {
    return this.notificationService.getNotifications(req.user.id);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  getUnreadCount(@Request() req) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@Param('id') id: string, @Request() req) {
    return this.notificationService.markRead(id, req.user.id);
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  markAllRead(@Request() req) {
    return this.notificationService.markAllRead(req.user.id);
  }

  @Post('fcm-token')
  @UseGuards(JwtAuthGuard)
  async saveFcmToken(@Request() req, @Body() body: { token: string }) {
    await this.prisma.user.update({
      where: { id: req.user.id },
      data: { fcmToken: body.token },
    });
    return { ok: true };
  }

  // Endpoint test — chỉ dùng trong development/debug
  @Post('test-push')
  async testPush(@Body() body: { userId: string; title: string; message: string }) {
    if (!body.userId) return { error: 'userId required' };
    const user = await this.prisma.user.findUnique({
      where: { id: body.userId },
      select: { fcmToken: true, name: true },
    });
    if (!user?.fcmToken) return { error: 'no_fcm_token', name: user?.name };
    await this.notificationService.createNotification(
      body.userId,
      'deal',
      body.title || 'Thông báo test',
      body.message || 'Đây là thông báo test từ server.',
    );
    return { ok: true, tokenPreview: user.fcmToken.substring(0, 30) + '...' };
  }

  // Tạo dữ liệu test chat cho một userId
  @Post('dev/seed-chat')
  async seedChat(@Body() body: { userId: string }) {
    const userId = body.userId;
    if (!userId) return { error: 'userId required' };

    // Tìm post không phải của user này
    const post = await this.prisma.post.findFirst({
      where: { authorId: { not: userId }, status: 'available' },
      select: { id: true, title: true, authorId: true },
    });
    if (!post) return { error: 'Không tìm thấy bài đăng nào để test' };

    // Tạo hoặc lấy chat room
    let room = await this.prisma.chatRoom.findFirst({
      where: { postId: post.id, buyerId: userId },
    });
    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: { postId: post.id, buyerId: userId, sellerId: post.authorId },
      });
    }

    // Thêm tin nhắn test
    await this.prisma.message.createMany({
      data: [
        { roomId: room.id, senderId: post.authorId, text: 'Xin chào! Bạn cần hỗ trợ gì không?', isRead: true },
        { roomId: room.id, senderId: userId, text: 'Bạn ơi, món này còn không ạ?', isRead: true },
        { roomId: room.id, senderId: post.authorId, text: 'Còn bạn nhé! Bạn có muốn nhận không?', isRead: false },
      ],
      skipDuplicates: false,
    });

    // Gửi notification với roomId để test deep link
    await this.notificationService.createNotification(
      userId,
      'chat',
      'Tin nhắn mới từ người bán',
      'Còn bạn nhé! Bạn có muốn nhận không?',
      JSON.stringify({ roomId: room.id }),
    );

    return { ok: true, roomId: room.id, postTitle: post.title };
  }
}
