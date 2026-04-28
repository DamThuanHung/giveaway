import { Module, forwardRef } from '@nestjs/common';
import { KeywordAlertController } from './keyword-alert.controller';
import { KeywordAlertService } from './keyword-alert.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    // forwardRef vì NotificationController dùng KeywordAlertService → circular dep.
    // KeywordAlertService dùng NotificationService (gửi notification khi keyword match).
    forwardRef(() => NotificationModule),
  ],
  controllers: [KeywordAlertController],
  providers: [KeywordAlertService, PrismaService],
  exports: [KeywordAlertService],
})
export class KeywordAlertModule {}
