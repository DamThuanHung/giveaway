import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const VALID_EXERCISE_TYPES = ['vocab', 'translation', 'reorder', 'quiz', 'judgment', 'planning'];

@Injectable()
export class DacDinhService {
  constructor(private prisma: PrismaService) {}

  // Ghi lại 1 lần hoàn thành dạng bài — chạy song song với localStorage phía client (không thay
  // thế), chỉ để admin có nguồn dữ liệu server-side. Xem ADR-0015.
  recordAttempt(
    userId: string,
    dto: { chapterId: string; exerciseType: string; score: number; total: number },
  ) {
    if (!VALID_EXERCISE_TYPES.includes(dto.exerciseType)) {
      throw new BadRequestException('exerciseType không hợp lệ');
    }
    if (!dto.chapterId?.trim()) {
      throw new BadRequestException('Thiếu chapterId');
    }
    if (dto.total < 0 || dto.score < 0 || dto.score > dto.total) {
      throw new BadRequestException('score/total không hợp lệ');
    }
    return this.prisma.dacDinhAttempt.create({
      data: {
        userId,
        chapterId: dto.chapterId,
        exerciseType: dto.exerciseType,
        score: dto.score,
        total: dto.total,
      },
    });
  }
}
