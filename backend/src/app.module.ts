import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ServeStaticModule } from '@nestjs/serve-static'; // Đã sửa: Import từ đúng thư viện mới cài
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FavoriteController } from './favorite/favorite.controller';
import { FavoriteService } from './favorite/favorite.service';
import { PostController } from './post/post.controller';
import { PostService } from './post/post.service';
import { PrismaService } from './prisma/prisma.service';
import { ReportController } from './report/report.controller';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    // 1. Cấu hình xem ảnh: Trỏ ra ngoài 2 cấp (.. , ..) để tìm folder uploads ở gốc
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    
    // 2. Cấu hình JWT
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'cho_va_tang_dev_secret',
      signOptions: { expiresIn: '7d' },
    }),
    
    // 3. Module con
    ChatModule,
  ],
  controllers: [
    AppController,
    UserController,
    PostController,
    ReportController,
    FavoriteController,
  ],
  providers: [
    AppService,
    UserService,
    PrismaService,
    PostService,
    FavoriteService,
    // Lưu ý: Đã bỏ ReportService ở đây vì anh chưa có file service này
  ],
})
export class AppModule {}