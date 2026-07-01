import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async validateUser(login: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { login, deletedAt: null, active: true },
    });
    if (!user) throw new UnauthorizedException('Неверный логин или пароль');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Неверный логин или пароль');
    return user;
  }

  async login(user: { id: string; login: string; role: string; name: string }) {
    const payload = { sub: user.id, login: user.login, role: user.role };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = await this.createRefreshToken(user.id);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { id: user.id, login: user.login, role: user.role, name: user.name },
    };
  }

  async refresh(token: string) {
    const record = await this.prisma.refreshToken.findUnique({ where: { token }, include: { user: true } });
    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
    if (!record.user.active || record.user.deletedAt) {
      throw new UnauthorizedException('User is inactive');
    }
    await this.prisma.refreshToken.delete({ where: { id: record.id } });
    const newRefresh = await this.createRefreshToken(record.userId);
    const payload = { sub: record.user.id, login: record.user.login, role: record.user.role };
    const accessToken = this.jwt.sign(payload);
    return {
      access_token: accessToken,
      refresh_token: newRefresh,
      user: { id: record.user.id, login: record.user.login, role: record.user.role, name: record.user.name },
    };
  }

  async logout(userId: string, token?: string) {
    if (token) {
      await this.prisma.refreshToken.deleteMany({ where: { token } });
    } else {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(64).toString('hex');
    const expiresAt = new Date();
    const daysStr = this.config.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const days = parseInt(daysStr as string);
    expiresAt.setDate(expiresAt.getDate() + (isNaN(days) ? 7 : days));
    await this.prisma.refreshToken.create({ data: { token, userId, expiresAt } });
    return token;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new BadRequestException('Текущий пароль неверен');
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  }
}
