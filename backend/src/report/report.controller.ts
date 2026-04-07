import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportService } from './report.service';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  reportPost(
    @Request() req,
    @Body() body: { postId: string; reason: string },
  ) {
    return this.reportService.createReport(req.user.id, body.postId, body.reason);
  }
}
