import { Body, Controller, Post } from '@nestjs/common';

@Controller('report')
export class ReportController {
  @Post()
  reportPost(
    @Body()
    body: {
      postId: string;
      reason: string;
    },
  ) {
    console.log('🚨 REPORT:', body);

    return {
      message: 'Report received',
      data: body,
    };
  }
}