import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderSourcesService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeArchived = false) {
    return this.prisma.orderSource.findMany({
      where: includeArchived ? {} : { archived: false },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(name: string) {
    return this.prisma.orderSource.create({ data: { name } });
  }

  async update(id: string, data: { name?: string; archived?: boolean }) {
    const src = await this.prisma.orderSource.findUnique({ where: { id } });
    if (!src) throw new NotFoundException();
    return this.prisma.orderSource.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.orderSource.delete({ where: { id } });
  }
}
