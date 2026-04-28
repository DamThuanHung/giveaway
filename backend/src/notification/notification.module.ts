import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationCronService } from './notification-cron.service';
import { FcmService } from '../fcm/fcm.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { KeywordAlertModule } from '../keyword-alert/keyword-alert.module';

/// Module gom NotificationService + Gateway + Cron + FcmService thành 1 instance
/// duy nhất. Trước đây ChatModule và KeywordAlertModule khai báo NotificationService
/// riêng → 3 instance độc lập → realtime badge unread không fire vì gateway chỉ
/// wired vào instance trong AppModule.
///
/// Module export NotificationService + FcmService cho ChatModule + KeywordAlertModule
/// import (forwardRef vì KeywordAlertService cũng được dùng ở NotificationController →
/// circular).
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
    forwardRef(() => KeywordAlertModule),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationGateway,
    NotificationCronService,
    FcmService,
    PrismaService,
    JwtStrategy,
  ],
  exports: [NotificationService, FcmService],
})
export class NotificationModule {}
