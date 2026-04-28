import {
  BadRequestException, Injectable, NotFoundException, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';

const OTP_MAX_ATTEMPTS = 5;
const OTP_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // OTP store tạm thời (production scale >1 instance nên chuyển Redis).
  // attempts để chống brute force: 5 lần sai → xóa OTP, user phải request lại.
  private readonly otpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

  private generateOtp(): string {
    // crypto.randomInt — cryptographically secure, không phải Math.random
    return randomInt(100000, 1000000).toString();
  }

  /** Verify OTP + increment attempts, xóa khi hết attempts/hết hạn. Trả true nếu match. */
  private consumeOtp(key: string, otp: string): boolean {
    const stored = this.otpStore.get(key);
    if (!stored) return false;
    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(key);
      return false;
    }
    if (stored.otp === otp) {
      this.otpStore.delete(key);
      return true;
    }
    stored.attempts += 1;
    if (stored.attempts >= OTP_MAX_ATTEMPTS) {
      this.otpStore.delete(key); // quá 5 lần sai → buộc request lại
    }
    return false;
  }

  private async sendEmailOtp(email: string, otp: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('RESEND_API_KEY chưa cấu hình — không gửi được OTP');
      }
      console.log(`📧 [DEV] OTP cho ${email}: ${otp}`);
      return;
    }

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: 'Trao Tay <noreply@traotay.com.vn>',
      to: email,
      subject: 'Mã xác nhận OTP - Trao Tay',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto">
          <h2 style="color:#10B981">Mã xác nhận của bạn</h2>
          <p>Sử dụng mã OTP sau để xác nhận:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1A1A2E;padding:20px 0">${otp}</div>
          <p style="color:#6B7280;font-size:13px">Mã có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này với ai.</p>
        </div>
      `,
    });
    if (error) throw new Error(`Resend error: ${error.message}`);
  }

  /**
   * Welcome email sau khi user signup lần đầu — best effort, không block flow.
   * Engagement tuần đầu: giới thiệu 3 hành động đầu (đăng bài, follow, theo dõi keyword).
   */
  private async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return; // dev không có API key → skip silent

    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: 'Trao Tay <noreply@traotay.com.vn>',
        to: email,
        subject: 'Chào mừng bạn đến Trao Tay! 🎁',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;background:#FAFAFA">
            <div style="text-align:center;padding:24px 0">
              <h1 style="color:#10B981;margin:0">Trao Tay</h1>
              <p style="color:#6B7280;margin:4px 0 0">Chợ đồ cũ & trao tặng miễn phí</p>
            </div>
            <div style="background:white;padding:32px 24px;border-radius:12px">
              <h2 style="color:#1A1A2E;margin-top:0">Xin chào ${name},</h2>
              <p style="color:#374151;line-height:1.6">
                Cảm ơn bạn đã tham gia cộng đồng <strong>Trao Tay</strong>!
                Cùng nhau, chúng ta giúp những món đồ cũ tìm được chủ mới — giảm rác thải, sẻ chia yêu thương.
              </p>
              <h3 style="color:#1A1A2E;margin-top:24px">3 việc đầu tiên để bắt đầu:</h3>
              <ol style="color:#374151;line-height:1.8;padding-left:20px">
                <li><strong>Đăng món đồ đầu tiên</strong> — chỉ 30 giây, kèm 1-3 ảnh</li>
                <li><strong>Khám phá khu vực gần bạn</strong> — lọc theo tỉnh/quận, xem trên bản đồ</li>
                <li><strong>Theo dõi từ khóa quan tâm</strong> — nhận thông báo khi có bài mới khớp</li>
              </ol>
              <div style="text-align:center;margin-top:32px">
                <p style="color:#6B7280;font-size:13px">Mở app Trao Tay trên điện thoại để bắt đầu</p>
              </div>
            </div>
            <div style="text-align:center;padding:16px;color:#9CA3AF;font-size:12px">
              Bạn nhận được email này vì đã đăng ký tài khoản tại traotay.com.vn.<br/>
              Liên hệ: damhungtpt@gmail.com
            </div>
          </div>
        `,
      });
    } catch (err) {
      // Best effort — không throw, chỉ log để không block signup flow
      console.warn(`[WelcomeEmail] Failed for ${email}: ${(err as Error).message}`);
    }
  }

  private signToken(user: { id: string; email?: string | null; phone?: string | null; name?: string | null }) {
    return this.jwtService.signAsync({ sub: user.id, email: user.email ?? user.phone ?? '', name: user.name ?? null });
  }

  async devLogin(email: string, secret: string) {
    if (process.env.NODE_ENV === 'production') throw new UnauthorizedException('dev login disabled');
    if (!process.env.DEV_SECRET || secret !== process.env.DEV_SECRET) throw new UnauthorizedException();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    const accessToken = await this.signToken(user);
    return { accessToken, user: { id: user.id, email: user.email, name: user.name } };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        isPhoneVerified: true,
        _count: {
          select: {
            posts: true,
            dealsAsOwner: { where: { status: 'completed' } },
            dealsAsRequester: { where: { status: 'completed' } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return {
      ...user,
      completedDeals: (user._count.dealsAsOwner ?? 0) + (user._count.dealsAsRequester ?? 0),
    };
  }

  async updateUser(id: string, requesterId: string, data: any) {
    if (id !== requesterId) throw new UnauthorizedException('Không có quyền');
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.avatar && { avatar: data.avatar }),
      },
      select: { id: true, email: true, name: true, avatar: true },
    });
  }

  async uploadAvatar(userId: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: { id: true, avatar: true },
    });
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, avatar: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async phoneLogin(idToken: string) {
    // Xác minh Firebase ID token
    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException('Token Firebase không hợp lệ');
    }

    const phone = decoded.phone_number;
    if (!phone) throw new BadRequestException('Token không chứa số điện thoại');

    // Tìm hoặc tạo user theo SĐT
    let user = await this.prisma.user.findUnique({ where: { phone } });
    const isNewUser = !user;
    if (!user) {
      const banned = await this.prisma.bannedIdentity.findUnique({ where: { phone } });
      if (banned) throw new UnauthorizedException('Số điện thoại này không thể đăng ký tài khoản mới');
      user = await this.prisma.user.create({
        data: {
          phone,
          isPhoneVerified: true,
          name: `User_${phone.slice(-4)}`,
        },
      });
    } else if (!user.isPhoneVerified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true },
      });
    }

    if (user.isBanned) throw new UnauthorizedException('Tài khoản đã bị khóa');

    const accessToken = await this.signToken(user);
    return {
      message: 'Đăng nhập thành công',
      accessToken,
      isNewUser,
      user: { id: user.id, phone: user.phone, name: user.name, avatar: user.avatar, role: user.role, isPhoneVerified: user.isPhoneVerified },
    };
  }

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw new BadRequestException('Không thể chặn chính mình');
    await this.prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
    return { message: 'Đã chặn người dùng' };
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await this.prisma.blockedUser.deleteMany({ where: { blockerId, blockedId } });
    return { message: 'Đã bỏ chặn người dùng' };
  }

  async getBlockedUsers(blockerId: string) {
    return this.prisma.blockedUser.findMany({
      where: { blockerId },
      select: { blockedId: true, blocked: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const r = await this.prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    return r !== null;
  }

  async deleteAccount(userId: string) {
    await this.prisma.$transaction([
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.favorite.deleteMany({ where: { userId } }),
      this.prisma.follow.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } }),
      this.prisma.blockedUser.deleteMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } }),
      this.prisma.review.deleteMany({ where: { OR: [{ reviewerId: userId }, { revieweeId: userId }] } }),
      this.prisma.deal.deleteMany({ where: { OR: [{ requesterId: userId }, { ownerId: userId }] } }),
      this.prisma.message.deleteMany({ where: { senderId: userId } }),
      this.prisma.chatRoom.deleteMany({ where: { OR: [{ buyerId: userId }, { sellerId: userId }] } }),
      this.prisma.post.deleteMany({ where: { authorId: userId } }),
      // Soft delete: ẩn danh hóa + đánh dấu đã xóa (giải phóng email/phone để đăng ký lại)
      this.prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          name: 'Người dùng đã xóa',
          email: null,
          phone: null,
          avatar: null,
          fcmToken: null,
        },
      }),
    ]);
    return { message: 'Tài khoản đã được xóa thành công' };
  }

  // ─── Email OTP Login (dùng email dự phòng) ───────────────────────────────

  private get adminEmails(): string[] {
    const raw = process.env.ADMIN_EMAILS ?? '';
    return raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  }

  async sendEmailLoginOtp(email: string, adminOnly = false) {
    const emailLower = email.trim().toLowerCase();
    if (adminOnly && !this.adminEmails.includes(emailLower)) {
      throw new BadRequestException('Email này không có quyền truy cập trang quản trị');
    }
    const otp = this.generateOtp();
    this.otpStore.set(`login:${emailLower}`, { otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
    await this.sendEmailOtp(emailLower, otp);
    return { message: 'Đã gửi mã OTP đến email' };
  }

  async verifyEmailLoginOtp(email: string, otp: string) {
    const emailLower = email.trim().toLowerCase();
    if (!this.consumeOtp(`login:${emailLower}`, otp)) {
      throw new BadRequestException('Mã OTP không đúng hoặc đã hết hạn');
    }

    let user = await this.prisma.user.findUnique({ where: { email: emailLower } });
    const isNewUser = !user;
    const isAdmin = this.adminEmails.includes(emailLower);
    if (!user) {
      const banned = await this.prisma.bannedIdentity.findUnique({ where: { email: emailLower } });
      if (banned) throw new UnauthorizedException('Email này không thể đăng ký tài khoản mới');
      user = await this.prisma.user.create({
        data: { email: emailLower, role: isAdmin ? 'admin' : 'user' },
      });
      // Welcome email cho user mới qua OTP email — best effort
      this.sendWelcomeEmail(emailLower, user.name ?? 'bạn').catch(() => {});
    } else if (isAdmin && user.role !== 'admin') {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: 'admin' },
      });
    }
    if (user.isBanned) throw new UnauthorizedException('Tài khoản đã bị khóa');

    const accessToken = await this.signToken(user);
    return {
      message: isNewUser ? 'Đăng ký thành công' : 'Đăng nhập thành công',
      accessToken,
      isNewUser,
      user: { id: user.id, phone: user.phone, email: user.email, name: user.name, avatar: user.avatar, role: user.role, isPhoneVerified: user.isPhoneVerified },
    };
  }

  // ─── Liên kết email dự phòng (user đã đăng nhập) ─────────────────────────

  async sendLinkEmailOtp(userId: string, email: string) {
    const emailLower = email.trim().toLowerCase();
    const existed = await this.prisma.user.findUnique({ where: { email: emailLower } });

    // Silent response khi email đã tồn tại — chống enumeration.
    // Nếu thực sự collision, user verify OTP sẽ fail ở bước confirm (unique constraint).
    if (!existed) {
      const otp = this.generateOtp();
      this.otpStore.set(`link:${userId}:${emailLower}`, { otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
      await this.sendEmailOtp(emailLower, otp);
    }
    return { message: 'Nếu email hợp lệ, mã OTP đã được gửi' };
  }

  // ─── Liên kết SĐT dự phòng (user đã đăng nhập) ───────────────────────────

  /**
   * Đối xứng với confirmLinkEmail: user đăng nhập bằng email → liên kết SĐT để recovery.
   * Firebase đã verify SMS OTP ở client → server chỉ cần verify ID token + check collision.
   */
  async linkPhone(userId: string, idToken: string) {
    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException('Token Firebase không hợp lệ');
    }

    const phone = decoded.phone_number;
    if (!phone) throw new BadRequestException('Token không chứa số điện thoại');

    const banned = await this.prisma.bannedIdentity.findUnique({ where: { phone } });
    if (banned) throw new BadRequestException('Số điện thoại này không thể sử dụng');

    const existed = await this.prisma.user.findUnique({ where: { phone } });
    if (existed && existed.id !== userId) {
      throw new BadRequestException('Số điện thoại này đã được sử dụng bởi tài khoản khác');
    }

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { phone, isPhoneVerified: true },
      });
    } catch (err: any) {
      // Race condition: 2 user link cùng phone → check existed pass nhưng update P2002.
      // Bắt cụ thể để trả 400 thay vì 500.
      if (err?.code === 'P2002') {
        throw new BadRequestException('Số điện thoại này đã được sử dụng bởi tài khoản khác');
      }
      throw err;
    }
    return { message: 'Liên kết số điện thoại thành công' };
  }

  async confirmLinkEmail(userId: string, email: string, otp: string) {
    const emailLower = email.trim().toLowerCase();
    if (!this.consumeOtp(`link:${userId}:${emailLower}`, otp)) {
      throw new BadRequestException('Mã OTP không đúng hoặc đã hết hạn');
    }

    try {
      await this.prisma.user.update({ where: { id: userId }, data: { email: emailLower } });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new BadRequestException('Email này đã được sử dụng bởi tài khoản khác');
      }
      throw err;
    }
    return { message: 'Liên kết email thành công' };
  }
}
