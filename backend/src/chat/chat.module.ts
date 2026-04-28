import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
    // Import NotificationModule để dùng instance NotificationService + FcmService
    // chung với gateway — nếu khai báo riêng trong providers, sẽ tạo instance độc
    // lập không có gateway → realtime badge unread không fire.
    NotificationModule,
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, PrismaService, JwtStrategy],
  exports: [ChatService],
})
export class ChatModule {}
