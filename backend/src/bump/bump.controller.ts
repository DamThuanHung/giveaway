import { Controller, Post, Get, Param, Body, Query, Req, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BumpService, BumpPackageKey } from './bump.service';

@Controller('bump')
export class BumpController {
  constructor(private bump: BumpService) {}

  // POST /bump/:postId/order — tạo đơn PayOS
  @UseGuards(JwtAuthGuard)
  @Post(':postId/order')
  createOrder(
    @Param('postId') postId: string,
    @Body('package') pkg: BumpPackageKey,
    @Req() req: any,
  ) {
    if (!pkg || !['plus_3d', 'vip_7d'].includes(pkg)) {
      return { error: 'package phải là plus_3d hoặc vip_7d' };
    }
    return this.bump.createOrder(postId, req.user.userId, pkg);
  }

  // GET /bump/:postId/status — trạng thái boost hiện tại
  @Get(':postId/status')
  getStatus(@Param('postId') postId: string) {
    return this.bump.getBoostStatus(postId);
  }

  // POST /bump/webhook — PayOS gọi về sau thanh toán
  @Post('webhook')
  webhook(@Body() body: any) {
    return this.bump.handleWebhook(body);
  }

  // GET /bump/return — redirect sau khi thanh toán thành công
  @Get('return')
  returnUrl(@Query('postId') postId: string, @Res() res: Response) {
    // Flutter WebView sẽ detect URL này để đóng WebView
    res.redirect(`traotay://bump/success?postId=${postId}`);
  }

  // GET /bump/cancel — redirect sau khi huỷ thanh toán
  @Get('cancel')
  cancelUrl(@Query('postId') postId: string, @Res() res: Response) {
    res.redirect(`traotay://bump/cancel?postId=${postId}`);
  }
}
