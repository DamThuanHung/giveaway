import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PayOS, PaymentRequests, Webhooks, CreatePaymentLinkResponse } from '@payos/node';
import { PrismaService } from '../prisma/prisma.service';

export const BUMP_PACKAGES = {
  plus_3d: { tier: 2, amount: 5000,  days: 3, label: 'Plus 3 ngay'  },
  vip_7d:  { tier: 3, amount: 15000, days: 7, label: 'VIP 7 ngay'   },
} as const;

export type BumpPackageKey = keyof typeof BUMP_PACKAGES;

@Injectable()
export class BumpService {
  private readonly logger = new Logger(BumpService.name);
  private paymentRequests: PaymentRequests;
  private webhooks: Webhooks;

  constructor(private prisma: PrismaService) {
    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

    if (!clientId || !apiKey || !checksumKey) {
      this.logger.warn('PayOS credentials thiếu — tính năng thanh toán Plus/VIP sẽ báo lỗi khi gọi.');
    }

    const publicUrl = process.env.PUBLIC_URL || process.env.BASE_URL;
    if (!publicUrl) {
      this.logger.warn('PUBLIC_URL và BASE_URL đều thiếu — PayOS return/cancel URL sẽ invalid.');
    } else if (/localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\./.test(publicUrl)) {
      this.logger.warn(
        `PUBLIC_URL có vẻ là LAN/localhost (${publicUrl}) — PayOS không gọi webhook được từ internet. Dùng ngrok hoặc domain công khai.`,
      );
    }

    const client = new PayOS({
      clientId:    clientId    ?? '',
      apiKey:      apiKey      ?? '',
      checksumKey: checksumKey ?? '',
    });
    this.paymentRequests = new PaymentRequests(client);
    this.webhooks = new Webhooks(client);
  }

  // ── Tạo đơn PayOS ─────────────────────────────────────────────────────────

  async createOrder(postId: string, userId: string, pkg: BumpPackageKey) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Bài đăng không tồn tại');
    if (post.authorId !== userId) throw new ForbiddenException('Không phải bài của bạn');

    const config = BUMP_PACKAGES[pkg];

    // Huỷ đơn pending cũ
    await this.prisma.bumpOrder.updateMany({
      where: { postId, userId, status: 'pending' },
      data: { status: 'cancelled' },
    });

    // PUBLIC_URL: URL public cho PayOS webhook/redirect (ngrok local / domain production).
    // BASE_URL: fallback — chỉ work nếu đã là public URL, không phải LAN IP.
    const publicUrl = process.env.PUBLIC_URL || process.env.BASE_URL;
    if (!publicUrl) {
      throw new ForbiddenException('PUBLIC_URL / BASE_URL chưa cấu hình — không thể tạo đơn PayOS');
    }
    const returnUrl = `${publicUrl}/bump/return?postId=${postId}`;
    const cancelUrl = `${publicUrl}/bump/cancel?postId=${postId}`;

    // Sinh orderCode + tạo BumpOrder với retry khi `payosOrderId @unique` collision.
    // Collision cực hiếm (2 user cùng ms + cùng random 0-999) nhưng vẫn có thể.
    let orderCode: number = 0;
    let order: { id: string } | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      orderCode = Date.now() % 9000000000 + Math.floor(Math.random() * 1000);
      try {
        order = await this.prisma.bumpOrder.create({
          data: {
            userId,
            postId,
            package: pkg,
            tier: config.tier,
            amount: config.amount,
            status: 'pending',
            payosOrderId: String(orderCode),
          },
        });
        break;
      } catch (err: any) {
        if (err?.code === 'P2002' && attempt < 2) continue; // unique violation → retry
        throw err;
      }
    }
    if (!order) throw new Error('Không thể sinh orderCode sau 3 lần thử');

    const paymentLink: CreatePaymentLinkResponse = await this.paymentRequests.create({
      orderCode,
      amount: config.amount,
      description: config.label,
      returnUrl,
      cancelUrl,
    });

    return {
      orderId: order.id,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      amount: config.amount,
      package: pkg,
    };
  }

  // ── Xử lý webhook PayOS ────────────────────────────────────────────────────

  async handleWebhook(body: any) {
    let data: any;
    try {
      data = await this.webhooks.verify(body);
    } catch (err) {
      this.logger.warn(`Webhook verify failed: ${(err as Error).message}`);
      return { ok: false, message: 'Invalid signature' };
    }

    if (data?.code !== '00') return { ok: true, message: 'Payment not successful' };

    const orderCode = String(data.orderCode);
    const order = await this.prisma.bumpOrder.findFirst({
      where: { payosOrderId: orderCode, status: 'pending' },
    });

    if (!order) return { ok: true, message: 'Order not found or already processed' };

    // Verify amount webhook khớp amount DB — chống mismatch từ PayOS hoặc replay
    if (Number(data.amount) !== order.amount) {
      this.logger.error(
        `Amount mismatch orderCode=${orderCode}: webhook=${data.amount} vs DB=${order.amount}`,
      );
      return { ok: false, message: 'Amount mismatch' };
    }

    const config = BUMP_PACKAGES[order.package as BumpPackageKey];
    const expiredAt = new Date(Date.now() + config.days * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.bumpOrder.update({
        where: { id: order.id },
        data: { status: 'paid', expiredAt },
      }),
      this.prisma.post.update({
        where: { id: order.postId },
        data: { boostTier: order.tier, bumpedAt: new Date() },
      }),
    ]);

    this.logger.log(
      `Bump paid: orderCode=${orderCode} postId=${order.postId} tier=${order.tier} amount=${order.amount}`,
    );
    return { ok: true, message: 'Payment processed' };
  }

  // ── Boost status ───────────────────────────────────────────────────────────

  async getBoostStatus(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { boostTier: true, bumpedAt: true },
    });
    if (!post) throw new NotFoundException('Bài đăng không tồn tại');

    const activeOrder = await this.prisma.bumpOrder.findFirst({
      where: { postId, status: 'paid', expiredAt: { gt: new Date() } },
      orderBy: { expiredAt: 'desc' },
    });

    const expiredAt = activeOrder?.expiredAt ?? null;
    const remainingMs = expiredAt ? expiredAt.getTime() - Date.now() : null;
    const remainingHours = remainingMs ? Math.ceil(remainingMs / (1000 * 60 * 60)) : null;

    return {
      boostTier: post.boostTier,
      bumpedAt: post.bumpedAt,
      expiredAt,
      remainingHours,
      packages: BUMP_PACKAGES,
    };
  }

  // ── Dev endpoint: boost thủ công bài của user theo tier ───────────────────

  async devBoost(userEmail: string, tier: number, postId?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) throw new NotFoundException(`User "${userEmail}" không tồn tại`);

    const post = postId
      ? await this.prisma.post.findUnique({ where: { id: postId } })
      : await this.prisma.post.findFirst({
          where: { authorId: user.id, status: 'available' },
          orderBy: { createdAt: 'asc' },
        });
    if (!post) throw new NotFoundException('Không tìm thấy bài available của user');

    const pkg = tier === 3 ? 'vip_7d' : 'plus_3d';
    const days = tier === 3 ? 7 : 3;
    const expiredAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.post.update({
        where: { id: post.id },
        data: { boostTier: tier, bumpedAt: new Date() },
      }),
      this.prisma.bumpOrder.create({
        data: {
          userId: user.id,
          postId: post.id,
          package: pkg,
          tier,
          amount: 0,
          status: 'paid',
          payosOrderId: `dev_${Date.now()}`,
          expiredAt,
        },
      }),
    ]);

    return {
      ok: true,
      postId: post.id,
      postTitle: post.title,
      userEmail,
      tier,
      days,
      expiredAt,
    };
  }

  // ── Cron: huỷ pending orders cũ hơn 30 phút ──────────────────────────────
  // User tạo đơn nhưng không thanh toán → pending rác trong DB.
  // PayOS không tự gửi webhook cancel → phải tự dọn.
  async cancelStalePending() {
    const threshold = new Date(Date.now() - 30 * 60 * 1000);
    const { count } = await this.prisma.bumpOrder.updateMany({
      where: { status: 'pending', createdAt: { lt: threshold } },
      data: { status: 'cancelled' },
    });
    if (count > 0) {
      this.logger.log(`Cancelled ${count} stale pending orders (>30 phút)`);
    }
    return count;
  }

  // ── Cron: reset boostTier khi hết hạn ─────────────────────────────────────

  async resetExpiredBoosts() {
    const expired = await this.prisma.bumpOrder.findMany({
      where: { status: 'paid', expiredAt: { lt: new Date() } },
      select: { id: true, postId: true },
    });

    for (const order of expired) {
      const stillActive = await this.prisma.bumpOrder.findFirst({
        where: {
          postId: order.postId,
          status: 'paid',
          expiredAt: { gt: new Date() },
          id: { not: order.id },
        },
      });

      await this.prisma.$transaction([
        this.prisma.bumpOrder.update({
          where: { id: order.id },
          data: { status: 'expired' },
        }),
        ...(stillActive ? [] : [
          this.prisma.post.update({
            where: { id: order.postId },
            data: { boostTier: 0 },
          }),
        ]),
      ]);
    }

    return expired.length;
  }
}
