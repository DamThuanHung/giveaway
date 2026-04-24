import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MAX_REASON_LEN = 500;

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async createReport(userId: string, postId: string, reason: string) {
    const cleanReason = String(reason ?? '').trim().slice(0, MAX_REASON_LEN);
    if (!cleanReason) throw new BadRequestException('Vui lòng nhập lý do báo cáo');

    // Verify post tồn tại + không phải post của mình
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) throw new NotFoundException('Bài đăng không tồn tại');
    if (post.authorId === userId) {
      throw new ForbiddenException('Không thể báo cáo bài đăng của chính mình');
    }

    // Không cho report trùng
    const existing = await this.prisma.report.findFirst({ where: { userId, postId } });
    if (existing) throw new BadRequestException('Bạn đã báo cáo bài đăng này rồi');

    const report = await this.prisma.report.create({
      data: { userId, postId, reason: cleanReason },
    });

    // Auto-hide khi >= 3 user khác nhau report
    const reportCount = await this.prisma.report.count({
      where: { postId, status: 'pending' },
    });
    if (reportCount >= 3) {
      await this.prisma.post.update({
        where: { id: postId },
        data: { status: 'hidden' },
      });
    }

    return report;
  }

  async getReports() {
    return this.prisma.report.findMany({
      include: {
        post: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
