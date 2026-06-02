import { Controller, Get, Param, Query, Redirect, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // GET /health — UptimeRobot / monitoring ping.
  // Trả 200 + check DB connection. Skip throttle để không bị rate limit bởi monitor.
  // GET /download/android — redirect đến APK + ghi log lượt tải
  @Get('download/:platform')
  @SkipThrottle()
  @Redirect()
  async downloadApp(@Param('platform') platform: string) {
    const safePlatform = ['android', 'ios'].includes(platform) ? platform : 'android';
    await this.prisma.appDownloadLog.create({ data: { platform: safePlatform } });
    const url = process.env.APK_DOWNLOAD_URL
      || 'https://s3.traotay.com.vn/traotay/releases/traotay-latest.apk';
    return { url, statusCode: 302 };
  }

  // GET /threads/callback — nhận OAuth code từ Threads API, hiển thị để lấy token
  @Get('threads/callback')
  @SkipThrottle()
  threadsCallback(@Query('code') code: string, @Query('error') error: string, @Res() res: Response) {
    if (error) {
      return res.send(`<h2>❌ Lỗi: ${error}</h2>`);
    }
    if (!code) {
      return res.send(`<h2>❌ Không có code</h2>`);
    }
    return res.send(`
      <html><body style="font-family:monospace;padding:32px;background:#f0fdf4">
        <h2>✅ Threads OAuth Code</h2>
        <p>Copy đoạn code dưới đây gửi cho Claude:</p>
        <textarea rows="4" cols="80" style="font-size:14px">${code}</textarea>
        <br><br>
        <p style="color:#666;font-size:12px">Code này hết hạn sau vài phút — dùng ngay.</p>
      </body></html>
    `);
  }

  @Get('health')
  @SkipThrottle()
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        status: 'error',
        error: (err as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
