import { Controller, Get, HttpCode, Param, Post, Query, Redirect, Res } from '@nestjs/common';
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
  // GET /download/android — chỉ redirect đến APK, KHÔNG ghi log (xem lý do dưới
  // POST /download/track). Giữ route này để link cũ/QR/share không bị 404.
  @Get('download/:platform')
  @SkipThrottle()
  @Redirect()
  async downloadApp(@Param('platform') platform: string) {
    const url = process.env.APK_DOWNLOAD_URL
      || 'https://s3.traotay.com.vn/traotay/releases/traotay-latest.apk';
    return { url, statusCode: 302 };
  }

  // POST /download/track/android — ghi log lượt tải, gọi bằng JS từ nút bấm
  // trên landing page (web/components/DownloadAppButton.tsx). Trước đây log tại
  // GET /download/:platform nhưng request đó bị bot/crawler (Facebook link
  // preview, Googlebot, GPTBot...) gọi tới đúng URL mỗi khi link được share,
  // khiến số liệu sai lệch ~65% (xem ADR-0012). Bot không chạy JS nên không gọi
  // được endpoint này → số liệu phản ánh đúng người bấm thật.
  @Post('download/track/:platform')
  @SkipThrottle()
  @HttpCode(204)
  async trackDownload(@Param('platform') platform: string) {
    const safePlatform = ['android', 'ios'].includes(platform) ? platform : 'android';
    await this.prisma.appDownloadLog.create({ data: { platform: safePlatform } });
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

  // POST /threads/deauth — Threads gọi khi user gỡ quyền app (GDPR deauth callback)
  @Get('threads/deauth')
  @SkipThrottle()
  threadsDeauth(@Res() res: Response) {
    return res.status(200).json({ ok: true });
  }

  // POST /threads/delete — Threads gọi khi user yêu cầu xóa dữ liệu (GDPR data deletion)
  @Get('threads/delete')
  @SkipThrottle()
  threadsDelete(@Res() res: Response) {
    return res.status(200).json({ ok: true });
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
        gitSha: process.env.GIT_SHA ?? 'unknown',
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
