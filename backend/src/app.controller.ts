import { Controller, Get, Param, Redirect } from '@nestjs/common';
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
