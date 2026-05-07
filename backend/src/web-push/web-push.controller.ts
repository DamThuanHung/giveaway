import { Body, Controller, Delete, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WebPushService } from './web-push.service';

@Controller('web-push')
export class WebPushController {
  constructor(private readonly webPush: WebPushService) {}

  /// Public — frontend cần để subscribe push
  @Get('vapid-key')
  getVapidKey() {
    return { publicKey: this.webPush.getPublicKey() };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  subscribe(
    @Request() req,
    @Body()
    body: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      userAgent?: string;
    },
  ) {
    return this.webPush.subscribe(req.user.id, body);
  }

  @Delete('subscribe')
  @UseGuards(JwtAuthGuard)
  unsubscribe(@Request() req, @Body() body: { endpoint: string }) {
    return this.webPush.unsubscribe(req.user.id, body.endpoint);
  }
}
