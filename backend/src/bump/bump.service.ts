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

    const orderCode = Date.now() % 9000000000 + Math.floor(Math.random() * 1000);
    // PUBLIC_URL: URL public cho PayOS webhook/redirect (ngrok local / domain production).
    // BASE_URL: fallback — chỉ work nếu đã là public URL, không phải LAN IP.
    const publicUrl = process.env.PUBLIC_URL || process.env.BASE_URL;
    const returnUrl = `${publicUrl}/bump/return?postId=${postId}`;
    const cancelUrl = `${publicUrl}/bump/cancel?postId=${postId}`;

    const paymentLink: CreatePaymentLinkResponse = await this.paymentRequests.create({
      orderCode,
      amount: config.amount,
      description: config.label,
      returnUrl,
      cancelUrl,
    });

    const order = await this.prisma.bumpOrder.create({
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
