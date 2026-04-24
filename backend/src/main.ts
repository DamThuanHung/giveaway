import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Graceful shutdown: khi nhận SIGTERM/SIGINT, đóng connection đang xử lý
  // trước khi exit. Tránh lost request khi Docker restart.
  app.enableShutdownHooks();

  app.use(helmet());

  // CORS: production phải set CORS_ORIGIN="https://traotay.com.vn,https://www.traotay.com.vn"
  // Mobile app không gửi Origin header nên không bị ảnh hưởng.
  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map(s => s.trim()) : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,x-dev-secret',
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }));

  // Legacy /uploads serve — chỉ enable ở dev. Production dùng MinIO thuần.
  if (process.env.NODE_ENV !== 'production') {
    const uploadDir = join(__dirname, '..', 'uploads');
    app.useStaticAssets(uploadDir, { prefix: '/uploads/' });
  }
  app.useStaticAssets(join(__dirname, '..', '..', 'public'));

  const port = process.env.PORT || 3800;
  await app.listen(port);

  const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
  console.log(`\n==========================================`);
  console.log(`✅ Backend ready (${process.env.NODE_ENV || 'development'})`);
  console.log(`   ${baseUrl}`);
  console.log(`==========================================\n`);
}
bootstrap();
