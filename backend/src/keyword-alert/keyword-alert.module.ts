import { Module } from '@nestjs/common';
import { KeywordAlertController } from './keyword-alert.controller';
import { KeywordAlertService } from './keyword-alert.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { FcmService } from '../fcm/fcm.service';

@Module({
  controllers: [KeywordAlertController],
  providers: [KeywordAlertService, PrismaService, NotificationService, FcmService],
  exports: [KeywordAlertService],
})
export class KeywordAlertModule {}
