import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DealService } from './deal.service';

@Controller('deal')
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createDeal(@Request() req, @Body() body: { postId: string; message?: string }) {
    return this.dealService.createDeal(req.user.id, body.postId, body.message);
  }

  @Get('incoming')
  @UseGuards(JwtAuthGuard)
  getIncoming(@Request() req) {
    return this.dealService.getIncomingDeals(req.user.id);
  }

  @Get('outgoing')
  @UseGuards(JwtAuthGuard)
  getOutgoing(@Request() req) {
    return this.dealService.getOutgoingDeals(req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Request() req, @Body() body: { status: string }) {
    return this.dealService.updateDealStatus(id, req.user.id, body.status);
  }
}
