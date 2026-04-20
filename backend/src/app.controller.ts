import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('debug/cloudinary-env')
  debugCloudinaryEnv() {
    return {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? `set(${process.env.CLOUDINARY_CLOUD_NAME})` : 'MISSING',
      api_key: process.env.CLOUDINARY_API_KEY ? `set(${process.env.CLOUDINARY_API_KEY?.slice(0, 6)}...)` : 'MISSING',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'set' : 'MISSING',
    };
  }
}
