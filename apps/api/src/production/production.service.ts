import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { CreateProductionDto } from './dto/create-production.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ProductionService {
  constructor(
    private prisma: PrismaService,
    private products: ProductsService,
  ) {}

  async findAll(query: PaginationDto) {
    const { page = 1, limit = 20 } = query;
    const [items, total] = await Promise.all([
      this.prisma.production.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          materials: { include: { material: true } },
          products: true,
        },
      }),
      this.prisma.production.count(),
    ]);
    return { items, total, page, limit };
  }

  async create(dto: CreateProductionDto, actorId: string, actorName: string) {
    // Validate material stock
    for (const m of dto.materials) {
      const movs = await this.prisma.materialMovement.findMany({ where: { materialId: m.materialId } });
      const stock = movs.reduce((acc, mv) => mv.type === 'IN' ? acc + mv.qty : acc - mv.qty, 0);
      if (m.qty > stock) {
        const mat = await this.prisma.material.findUnique({ where: { id: m.materialId } });
        throw new BadRequestException(`Недостаточно материала: ${mat?.name ?? m.materialId}`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const production = await tx.production.create({
        data: {
          notes: dto.notes ?? '',
          actorId,
          actorName,
          materials: { create: dto.materials.map(m => ({ materialId: m.materialId, qty: m.qty })) },
          products: { create: dto.products.map(p => ({ productId: p.productId, qty: p.qty })) },
        },
        include: {
          materials: { include: { material: true } },
          products: true,
        },
      });

      // Write material OUT movements
      for (const m of dto.materials) {
        await tx.materialMovement.create({
          data: {
            materialId: m.materialId,
            type: 'OUT',
            qty: m.qty,
            comment: `Производство #${production.id.slice(-6)}`,
            actorId,
            actorName,
            productionId: production.id,
          },
        });
      }

      // Write product IN (PRODUCE) movements
      for (const p of dto.products) {
        await tx.productMovement.create({
          data: {
            productId: p.productId,
            type: 'PRODUCE',
            qty: p.qty,
            comment: `Производство #${production.id.slice(-6)}`,
            actorId,
            actorName,
          },
        });
      }

      return production;
    });
  }
}
