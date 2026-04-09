import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ServeStaticModule } from '@nestjs/serve-static';
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
import { FcmService } from './fcm/fcm.service';
import { NotificationController } from './notification/notification.controller';
import { NotificationGateway } from './notification/notification.gateway';
import { NotificationService } from './notification/notification.service';
import { PostController } from './post/post.controller';
import { PostService } from './post/post.service';
import { PrismaService } from './prisma/prisma.service';
import { ReportController } from './report/report.controller';
import { ReportService } from './report/report.service';
import { ReviewController } from './review/review.controller';
import { ReviewService } from './review/review.service';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';

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
  ],
  controllers: [
    AppController,
    AdminController,
    UserController,
    PostController,
    ReportController,
    FavoriteController,
    DealController,
    ReviewController,
    NotificationController,
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
    DealService,
    ReviewService,
    NotificationService,
    NotificationGateway,
    FcmService,
    JwtStrategy,
  ],
})
export class AppModule {}
