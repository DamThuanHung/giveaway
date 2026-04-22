import { Body, Controller, Delete, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { KeywordAlertService } from './keyword-alert.service';

@Controller('keyword-alert')
@UseGuards(JwtAuthGuard)
export class KeywordAlertController {
  constructor(private readonly service: KeywordAlertService) {}

  @Get()
  list(@Request() req) {
    return this.service.list(req.user.id);
  }

  @Post()
  subscribe(@Request() req, @Body() body: { keyword: string }) {
    return this.service.subscribe(req.user.id, body.keyword);
  }

  @Delete()
  unsubscribe(@Request() req, @Body() body: { keyword: string }) {
    return this.service.unsubscribe(req.user.id, body.keyword);
  }
}
