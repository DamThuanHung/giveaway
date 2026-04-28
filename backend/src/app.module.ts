import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { join } from 'path';
import { AdminController } from './admin/admin.controller';
import { AdminGuard } from './admin/admin.guard';
import { AdminService } from './admin/admin.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { ChatModule } from './chat/chat.module';
import { DealController } from './deal/deal.controller';
import { DealService } from './deal/deal.service';
import { FavoriteController } from './favorite/favorite.controller';
import { FavoriteService } from './favorite/favorite.service';
import { FollowController } from './follow/follow.controller';
import { FollowService } from './follow/follow.service';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { NotificationModule } from './notification/notification.module';
import { PostController } from './post/post.controller';
import { PostService } from './post/post.service';
import { PrismaService } from './prisma/prisma.service';
import { ReportController } from './report/report.controller';
import { ReportService } from './report/report.service';
import { ReviewController } from './review/review.controller';
import { ReviewService } from './review/review.service';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { KeywordAlertModule } from './keyword-alert/keyword-alert.module';
import { BumpModule } from './bump/bump.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
    ChatModule,
    CloudinaryModule,
    KeywordAlertModule,
    NotificationModule,
    BumpModule,
    ScheduleModule.forRoot(),
    // Rate limit default: 60 req/phút/IP cho mọi endpoint.
    // Endpoint nhạy cảm (OTP, webhook, upload) dùng @Throttle override.
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 60 },
    ]),
  ],
  controllers: [
    AppController,
    AdminController,
    UserController,
    PostController,
    ReportController,
    FavoriteController,
    FollowController,
    DealController,
    ReviewController,
    // NotificationController moved into NotificationModule
  ],
  providers: [
    AppService,
    AdminService,
    AdminGuard,
    PrismaService,
    UserService,
    PostService,
    ReportService,
    FavoriteService,
    FollowService,
    DealService,
    ReviewService,
    // NotificationService/Gateway/Cron + FcmService moved into NotificationModule
    // KeywordAlertService comes from KeywordAlertModule (exported)
    JwtStrategy,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
