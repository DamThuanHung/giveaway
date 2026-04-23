import { Module } from '@nestjs/common';
import { BumpController } from './bump.controller';
import { BumpService } from './bump.service';
import { BumpCronService } from './bump.cron';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [BumpController],
  providers: [BumpService, BumpCronService, PrismaService],
  exports: [BumpService],
})
export class BumpModule {}
