import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto & { size?: string; color?: string }) {
    const { page = 1, limit = 50, search, size, color } = query;
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { article: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (size) where.size = size;
    if (color) where.color = { contains: color, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const p = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!p) throw new NotFoundException('Товар не найден');
    return p;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getStock(id: string): Promise<number> {
    const agg = await this.prisma.productMovement.groupBy({
      by: ['type'],
      where: { productId: id },
      _sum: { qty: true },
    });
    let stock = 0;
    for (const g of agg) {
      if (g.type === 'IN' || g.type === 'PRODUCE') stock += g._sum.qty ?? 0;
      if (g.type === 'OUT' || g.type === 'SHIP') stock -= g._sum.qty ?? 0;
    }
    return Math.max(0, stock);
  }
}
