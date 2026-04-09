import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async createReport(userId: string, postId: string, reason: string) {
    // Không cho report trùng
    const existing = await this.prisma.report.findFirst({ where: { userId, postId } });
    if (existing) throw new BadRequestException('Bạn đã báo cáo bài đăng này rồi');

    const report = await this.prisma.report.create({
      data: { userId, postId, reason },
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
