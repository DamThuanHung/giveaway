import { BadRequestException, Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AdminGuard } from './admin.guard';
import { TiktokService, PublishParams } from './tiktok.service';

// KHÔNG @UseGuards(AdminGuard) ở class-level (khác AdminController) — /callback
// phải public vì TikTok redirect trình duyệt tới đây, không gửi kèm header auth.
@Controller('admin/tiktok')
export class TiktokController {
  constructor(private tiktok: TiktokService) {}

  @Get('status')
  @UseGuards(AdminGuard)
  async status() {
    return { configured: this.tiktok.configured, connected: await this.tiktok.isConnected() };
  }

  @Get('auth-url')
  @UseGuards(AdminGuard)
  authUrl() {
    return { url: this.tiktok.buildAuthUrl() };
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const adminHtmlUrl = '/admin.html#tiktok';
    if (!code || !state || !this.tiktok.validateState(state)) {
      return res.redirect(`${adminHtmlUrl}?tiktok_error=state_invalid`);
    }
    try {
      await this.tiktok.exchangeCodeForToken(code);
      return res.redirect(`${adminHtmlUrl}?tiktok_connected=1`);
    } catch (err: any) {
      return res.redirect(`${adminHtmlUrl}?tiktok_error=${encodeURIComponent(err.message)}`);
    }
  }

  @Get('creator-info')
  @UseGuards(AdminGuard)
  creatorInfo() {
    return this.tiktok.getCreatorInfo();
  }

  @Post('publish')
  @UseGuards(AdminGuard)
  publish(@Body() body: PublishParams) {
    if (!body.videoUrl || !body.caption || !body.privacyLevel) {
      throw new BadRequestException('Thiếu videoUrl/caption/privacyLevel');
    }
    return this.tiktok.publish(body);
  }
}
