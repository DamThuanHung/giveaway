import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Cải tiến: Xác định thư mục uploads dựa trên vị trí file thực tế
  const uploadDir = join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Thư mục "uploads" đã được chuẩn bị.');
  }

  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({ 
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Cấu hình xem ảnh: prefix phải khớp với logic lưu trong Database
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
  });

  // Lắng nghe trên 0.0.0.0 là chuẩn nhất cho máy thật
  await app.listen(3800, '0.0.0.0');
  
  console.log(`\n==========================================`);
  console.log(`✅ SERVER JIMOTY ĐÃ SẴN SÀNG PHỤC VỤ`);
  console.log(`------------------------------------------`);
  console.log(`📱 Realme Access: http://192.168.0.108:3800`);
  console.log(`🖼️  Image Path:   http://192.168.0.108:3800/uploads/`);
  console.log(`==========================================\n`);
}
bootstrap();