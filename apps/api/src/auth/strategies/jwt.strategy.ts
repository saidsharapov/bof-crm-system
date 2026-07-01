import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') ?? 'fallback-secret',
    });
  }

  async validate(payload: { sub: string; login: string; role: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active || user.deletedAt) throw new UnauthorizedException();
    return user;
  }
}
