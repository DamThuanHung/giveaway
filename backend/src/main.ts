import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const uploadDir = join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  console.log('📁 Thư mục "uploads" đã được chuẩn bị.');

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }));

  app.useStaticAssets(uploadDir, { prefix: '/uploads/' });
  app.useStaticAssets(join(__dirname, '..', 'public'));

  const port = process.env.PORT || 3800;
  await app.listen(port);

  console.log(`\n==========================================`);
  console.log(`✅ SERVER JIMOTY ĐÃ SẴN SÀNG`);
  console.log(`   http://192.168.0.108:${port}`);
  console.log(`==========================================\n`);
}
bootstrap();
