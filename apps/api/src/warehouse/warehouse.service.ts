import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { AddProductMovementDto } from './dto/add-product-movement.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class WarehouseService {
  constructor(
    private prisma: PrismaService,
    private products: ProductsService,
  ) {}

  async getStockList(query: PaginationDto & { lowStock?: boolean }) {
    const { page = 1, limit = 50, search, lowStock } = query;
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { article: { contains: search, mode: 'insensitive' } },
      ];
    }

    const prods = await this.prisma.product.findMany({ where });
    const withStock = await Promise.all(
      prods.map(async (p) => {
        const stock = await this.products.getStock(p.id);
        return { ...p, stock };
      }),
    );
    const filtered = lowStock ? withStock.filter(p => p.stock <= 5) : withStock;
    const start = (page - 1) * limit;
    return { items: filtered.slice(start, start + limit), total: filtered.length, page, limit };
  }

  async addProductMovement(dto: AddProductMovementDto, actorId: string, actorName: string) {
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, deletedAt: null } });
    if (!product) throw new NotFoundException('Товар не найден');

    if (dto.type === 'OUT') {
      const stock = await this.products.getStock(dto.productId);
      if (dto.qty > stock) throw new BadRequestException('Недостаточно товара на складе');
    }

    return this.prisma.productMovement.create({
      data: {
        productId: dto.productId,
        type: dto.type as any,
        qty: dto.qty,
        comment: dto.comment ?? '',
        actorId,
        actorName,
      },
      include: { product: true },
    });
  }

  async getProductMovements(query: PaginationDto & { productId?: string; type?: string }) {
    const { page = 1, limit = 50, productId, type } = query;
    const where: any = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      this.prisma.productMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { product: true },
      }),
      this.prisma.productMovement.count({ where }),
    ]);
    return { items, total, page, limit };
  }
}
