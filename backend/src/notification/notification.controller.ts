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
    await this.notificationService.createNotification(
      body.userId,
      'deal',
      body.title || 'Thông báo test',
      body.message || 'Đây là thông báo test từ server.',
    );
    return { ok: true };
  }
}
