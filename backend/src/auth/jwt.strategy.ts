import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET is not set'); })(),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.isBanned || user.deletedAt) throw new UnauthorizedException();

    // Throttle: chỉ ghi lastActiveAt 1 lần/ngày, tránh ghi DB trên mọi request
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    if (!user.lastActiveAt || user.lastActiveAt < todayStart) {
      this.prisma.user
        .update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
        .catch(() => {});
    }

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }
}
