import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async createReport(userId: string, postId: string, reason: string) {
    const report = await this.prisma.report.create({
      data: { userId, postId, reason },
    });

    // Auto-hide bài đăng khi bị report >= 3 lần
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
      include: { post: { select: { id: true, title: true } }, user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
