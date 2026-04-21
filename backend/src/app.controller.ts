import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('debug/dev-secret')
  debugDevSecret() {
    const val = process.env.DEV_SECRET;
    return { exists: !!val, length: val?.length, preview: val?.substring(0, 5) };
  }
}
