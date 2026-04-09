import {
  BadRequestException, Injectable, NotFoundException, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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
      select: { id: true, email: true, name: true, avatar: true, role: true, createdAt: true, _count: { select: { posts: true } } },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
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

  async uploadAvatar(userId: string, filename: string) {
    const avatarUrl = `${process.env.BASE_URL ?? ''}/uploads/${filename}`;
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
}
