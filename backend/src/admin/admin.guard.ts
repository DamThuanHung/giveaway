import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

// Phải dùng SAU JwtAuthGuard trong chain (vd @UseGuards(JwtAuthGuard, AdminGuard)) —
// JwtStrategy.validate() đã verify token + query User (kèm check isBanned/deletedAt)
// và set req.user, nên ở đây chỉ cần đọc lại role, không re-verify/re-query.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!req.user) throw new ForbiddenException('Cần đăng nhập');
    if (req.user.role !== 'admin') throw new ForbiddenException('Chỉ admin mới có quyền truy cập');
    return true;
  }
}
