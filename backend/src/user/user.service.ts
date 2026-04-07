import {
  BadRequestException, Injectable, NotFoundException, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private signToken(user: { id: string; email: string; name?: string | null }) {
    return this.jwtService.signAsync({ sub: user.id, email: user.email, name: user.name ?? null });
  }

  async createUser(data: any) {
    const email = data?.email?.toString().trim().toLowerCase();
    const password = data?.password?.toString();
    const name = data?.name?.toString().trim();

    if (!email || !password || !name) throw new BadRequestException('Thiếu name, email hoặc password');

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
    if (!user) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

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

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { message: 'Đổi mật khẩu thành công' };
  }

  async uploadAvatar(userId: string, filename: string) {
    const BASE_URL = process.env.BASE_URL || 'http://192.168.0.108:3800';
    const avatarUrl = `${BASE_URL}/uploads/${filename}`;
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: { id: true, avatar: true },
    });
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
