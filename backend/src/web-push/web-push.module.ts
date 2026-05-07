import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { WebPushService } from './web-push.service';
import { WebPushController } from './web-push.controller';

/// Web Push module — VAPID keys + subscribe/unsubscribe + push send.
/// Export WebPushService cho NotificationModule integrate vào createNotification.
@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [WebPushService, PrismaService, JwtStrategy],
  controllers: [WebPushController],
  exports: [WebPushService],
})
export class WebPushModule {}
