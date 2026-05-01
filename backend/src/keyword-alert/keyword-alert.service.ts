import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class KeywordAlertService {
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService,
  ) {}

  async subscribe(userId: string, keyword: string) {
    const kw = keyword.trim().toLowerCase();
    if (!kw || kw.length < 2) throw new BadRequestException('Từ khóa phải có ít nhất 2 ký tự');
    if (kw.length > 50) throw new BadRequestException('Từ khóa tối đa 50 ký tự');

    const count = await this.prisma.keywordAlert.count({ where: { userId } });
    if (count >= 10) throw new BadRequestException('Tối đa 10 từ khóa theo dõi');

    await this.prisma.keywordAlert.upsert({
      where: { userId_keyword: { userId, keyword: kw } },
      create: { userId, keyword: kw },
      update: {},
    });
    return { message: 'Đã theo dõi từ khóa', keyword: kw };
  }

  async unsubscribe(userId: string, keyword: string) {
    const kw = keyword.trim().toLowerCase();
    await this.prisma.keywordAlert.deleteMany({ where: { userId, keyword: kw } });
    return { message: 'Đã bỏ theo dõi từ khóa' };
  }

  async list(userId: string) {
    return this.prisma.keywordAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, keyword: true, createdAt: true },
    });
  }

  async notifyMatchingUsers(postId: string, postTitle: string, postDescription: string, authorId: string) {
    const titleLower = postTitle.toLowerCase();
    const descLower = postDescription.toLowerCase();
    const combinedText = `${titleLower} ${descLower}`;

    // Exclude những user đã block author hoặc bị author block (privacy)
    const blockedIds = await this.prisma.blockedUser.findMany({
      where: { OR: [{ blockerId: authorId }, { blockedId: authorId }] },
      select: { blockerId: true, blockedId: true },
    });
    const excludedUserIds = new Set<string>([
      authorId,
      ...blockedIds.flatMap(b => [b.blockerId, b.blockedId]),
    ]);

    // PB3 (Tier 4): Filter ở DB level dùng SQL WHERE thay vì JS filter.
    // Trước đây findMany ALL keywordAlerts (10k+ at scale) → filter JS — full
    // table scan + memory load. Giờ raw SQL với ILIKE — tận dụng index keyword.
    //
    // Logic: "title + desc" CONTAINS keyword → match.
    // Vd: title="Áo Zara", keyword="zara" → ILIKE '%zara%' → match.
    // Prisma.join() để parameterize IDs an toàn (chống SQL injection).
    const excludedArray = Array.from(excludedUserIds);
    const matched = excludedArray.length > 0
      ? await this.prisma.$queryRaw<{ userId: string; keyword: string }[]>`
          SELECT DISTINCT "userId", keyword
          FROM "KeywordAlert"
          WHERE "userId" NOT IN (${Prisma.join(excludedArray)})
            AND ${combinedText} ILIKE '%' || keyword || '%'
        `
      : await this.prisma.$queryRaw<{ userId: string; keyword: string }[]>`
          SELECT DISTINCT "userId", keyword
          FROM "KeywordAlert"
          WHERE ${combinedText} ILIKE '%' || keyword || '%'
        `;

    // Gom theo userId để không gửi nhiều notification cho cùng 1 user
    const byUser = new Map<string, string[]>();
    for (const m of matched) {
      if (!byUser.has(m.userId)) byUser.set(m.userId, []);
      byUser.get(m.userId)!.push(m.keyword);
    }

    await Promise.all([...byUser.entries()].map(([userId, keywords]) =>
      this.notification.createNotification(
        userId,
        'keyword_alert',
        'Có bài đăng mới phù hợp',
        `Bài "${postTitle}" khớp với từ khóa bạn theo dõi: ${keywords.join(', ')}`,
        JSON.stringify({ postId, keywords }),
      ).catch(() => {}),
    ));
  }
}
