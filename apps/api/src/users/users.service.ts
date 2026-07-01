import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, login: true, name: true, role: true, active: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findFirst({ where: { login: dto.login, deletedAt: null } });
    if (exists) throw new ConflictException('Логин уже занят');
    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { ...dto, password: hashed },
      select: { id: true, login: true, name: true, role: true, active: true, createdAt: true },
    });
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException();
    if (dto.login && dto.login !== user.login) {
      const exists = await this.prisma.user.findFirst({ where: { login: dto.login, deletedAt: null } });
      if (exists) throw new ConflictException('Логин уже занят');
    }
    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 12);
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, login: true, name: true, role: true, active: true, createdAt: true },
    });
  }

  async remove(id: string) {
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
