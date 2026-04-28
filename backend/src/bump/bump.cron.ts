import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BumpService } from './bump.service';

@Injectable()
export class BumpCronService {
  private readonly logger = new Logger(BumpCronService.name);
  constructor(private bump: BumpService) {}

  // Mỗi giờ: reset boostTier các bài hết hạn
  @Cron(CronExpression.EVERY_HOUR)
  async resetExpiredBoosts() {
    const count = await this.bump.resetExpiredBoosts();
    if (count > 0) this.logger.log(`Reset ${count} expired boost orders`);
  }

  // Mỗi 5 phút: verify pending orders với PayOS API (chống miss webhook).
  // Nếu PayOS confirm PAID → tự mark + boost mà không cần webhook.
  @Cron(CronExpression.EVERY_5_MINUTES)
  async verifyPendingOrders() {
    const result = await this.bump.verifyPendingOrders();
    if (result.recovered > 0) {
      this.logger.log(
        `[Cron] Verify pending orders: recovered ${result.recovered}/${result.checked}`,
      );
    }
  }

  // Mỗi 30 phút: huỷ pending orders cũ hơn 30 phút (user bỏ ngang)
  @Cron(CronExpression.EVERY_30_MINUTES)
  async cancelStalePending() {
    await this.bump.cancelStalePending();
  }
}
