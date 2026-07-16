import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DacDinhService } from './dac-dinh.service';

@Controller('dac-dinh')
export class DacDinhController {
  constructor(private readonly dacDinhService: DacDinhService) {}

  @Post('attempt')
  @UseGuards(JwtAuthGuard)
  recordAttempt(
    @Request() req,
    @Body() body: { chapterId: string; exerciseType: string; score: number; total: number },
  ) {
    return this.dacDinhService.recordAttempt(req.user.id, body);
  }
}
