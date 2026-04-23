import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BumpService } from './bump.service';

@Injectable()
export class BumpCronService {
  constructor(private bump: BumpService) {}

  // Chạy mỗi giờ — reset boostTier các bài hết hạn
  @Cron(CronExpression.EVERY_HOUR)
  async resetExpiredBoosts() {
    const count = await this.bump.resetExpiredBoosts();
    if (count > 0) console.log(`[BumpCron] Reset ${count} expired boost orders`);
  }
}
