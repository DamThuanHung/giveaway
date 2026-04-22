import {
  BadRequestException, Injectable, NotFoundException, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // OTP store tạm thời (production nên dùng Redis)
  private readonly otpStore = new Map<string, { otp: string; expiresAt: number }>();

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendEmailOtp(email: string, otp: string): Promise<void> {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Nếu chưa cấu hình SMTP → log ra console để test
    if (!smtpUser || !smtpPass) {
      console.log(`📧 [DEV] OTP cho ${email}: ${otp}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"Trao Tay" <${smtpUser}>`,
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
  }

  private signToken(user: { id: string; email?: string | null; phone?: string | null; name?: string | null }) {
    return this.jwtService.signAsync({ sub: user.id, email: user.email ?? user.phone ?? '', name: user.name ?? null });
  }

  async createUser(data: any) {
    const email = data?.email?.toString().trim().toLowerCase();
    const password = data?.password?.toString();
    const name = data?.name?.toString().trim();

    if (!email || !password || !name) throw new BadRequestException('Thiếu name, email hoặc password');
    if (password.length < 6) throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');

    const existed = await this.prisma.user.findUnique({ where: { email } });
    if (existed) throw new BadRequestException('Email đã tồn tại');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({ data: { email, password: hashedPassword, name } });
    const accessToken = await this.signToken(user);

    return { message: 'Tạo tài khoản thành công', accessToken, user: { id: user.id, email: user.email, name: user.name } };
  }

  async login(data: any) {
    const email = data?.email?.toString().trim().toLowerCase();
    const password = data?.password?.toString();

    if (!email || !password) throw new BadRequestException('Thiếu email hoặc password');

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    if (user.isBanned) throw new UnauthorizedException('Tài khoản đã bị khóa');

    const accessToken = await this.signToken(user);
    return {
      message: 'Đăng nhập thành công',
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, role: user.role },
    };
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

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) throw new BadRequestException('Mật khẩu cũ không đúng');
    if (!newPassword || newPassword.length < 6) throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { message: 'Đổi mật khẩu thành công' };
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
      this.prisma.user.delete({ where: { id: userId } }),
    ]);
    return { message: 'Tài khoản đã được xóa thành công' };
  }

  // ─── Email OTP Login (dùng email dự phòng) ───────────────────────────────

  private get adminEmails(): string[] {
    const raw = process.env.ADMIN_EMAILS ?? 'damhungtpt@gmail.com';
    return raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  }

  async sendEmailLoginOtp(email: string, adminOnly = false) {
    const emailLower = email.trim().toLowerCase();
    if (adminOnly && !this.adminEmails.includes(emailLower)) {
      throw new BadRequestException('Email này không có quyền truy cập trang quản trị');
    }
    const otp = this.generateOtp();
    this.otpStore.set(`login:${emailLower}`, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
    await this.sendEmailOtp(emailLower, otp);
    return { message: 'Đã gửi mã OTP đến email' };
  }

  async verifyEmailLoginOtp(email: string, otp: string) {
    const emailLower = email.trim().toLowerCase();
    const stored = this.otpStore.get(`login:${emailLower}`);
    if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
      throw new BadRequestException('Mã OTP không đúng hoặc đã hết hạn');
    }
    this.otpStore.delete(`login:${emailLower}`);

    let user = await this.prisma.user.findUnique({ where: { email: emailLower } });
    const isNewUser = !user;
    if (!user) {
      user = await this.prisma.user.create({
        data: { email: emailLower },
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

  // ─── Quên mật khẩu ───────────────────────────────────────────────────────

  async sendForgotPasswordOtp(email: string) {
    const emailLower = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: emailLower } });
    if (!user) throw new BadRequestException('Email này chưa được đăng ký');
    if (!user.password) throw new BadRequestException('Tài khoản này đăng nhập bằng SĐT, không có mật khẩu để đặt lại');

    const otp = this.generateOtp();
    this.otpStore.set(`reset:${emailLower}`, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
    await this.sendEmailOtp(emailLower, otp);
    return { message: 'Đã gửi mã OTP đến email' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const emailLower = email.trim().toLowerCase();
    const stored = this.otpStore.get(`reset:${emailLower}`);
    if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
      throw new BadRequestException('Mã OTP không đúng hoặc đã hết hạn');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }
    this.otpStore.delete(`reset:${emailLower}`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { email: emailLower }, data: { password: hashedPassword } });
    return { message: 'Đặt lại mật khẩu thành công' };
  }

  // ─── Liên kết email dự phòng (user đã đăng nhập) ─────────────────────────

  async sendLinkEmailOtp(userId: string, email: string) {
    const emailLower = email.trim().toLowerCase();
    const existed = await this.prisma.user.findUnique({ where: { email: emailLower } });
    if (existed) throw new BadRequestException('Email này đã được sử dụng bởi tài khoản khác');

    const otp = this.generateOtp();
    this.otpStore.set(`link:${userId}:${emailLower}`, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
    await this.sendEmailOtp(emailLower, otp);
    return { message: 'Đã gửi mã OTP đến email' };
  }

  async confirmLinkEmail(userId: string, email: string, otp: string) {
    const emailLower = email.trim().toLowerCase();
    const key = `link:${userId}:${emailLower}`;
    const stored = this.otpStore.get(key);
    if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
      throw new BadRequestException('Mã OTP không đúng hoặc đã hết hạn');
    }
    this.otpStore.delete(key);

    await this.prisma.user.update({ where: { id: userId }, data: { email: emailLower } });
    return { message: 'Liên kết email thành công' };
  }
}
