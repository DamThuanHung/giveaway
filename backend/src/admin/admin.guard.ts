import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) throw new ForbiddenException('Cần đăng nhập');

    const token = auth.slice(7);
    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new ForbiddenException('Token không hợp lệ');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.role !== 'admin') throw new ForbiddenException('Chỉ admin mới có quyền truy cập');
    if (user.isBanned) throw new ForbiddenException('Tài khoản đã bị cấm');
    if (user.deletedAt) throw new ForbiddenException('Tài khoản đã bị xóa');

    req.user = { id: user.id, role: user.role };
    return true;
  }
}
