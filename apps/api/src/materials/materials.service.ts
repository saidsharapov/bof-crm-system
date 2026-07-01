import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { AddMaterialMovementDto } from './dto/add-material-movement.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto) {
    const { page = 1, limit = 50, search } = query;
    const where: any = { deletedAt: null };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    const [items, total] = await Promise.all([
      this.prisma.material.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.material.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const m = await this.prisma.material.findFirst({ where: { id, deletedAt: null } });
    if (!m) throw new NotFoundException('Материал не найден');
    return m;
  }

  async create(dto: CreateMaterialDto) {
    return this.prisma.material.create({ data: dto });
  }

  async update(id: string, dto: UpdateMaterialDto) {
    await this.findOne(id);
    return this.prisma.material.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.material.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getStock(id: string): Promise<number> {
    const movs = await this.prisma.materialMovement.findMany({ where: { materialId: id } });
    return movs.reduce((acc, m) => m.type === 'IN' ? acc + m.qty : acc - m.qty, 0);
  }

  async addMovement(id: string, dto: AddMaterialMovementDto, actorId: string, actorName: string) {
    await this.findOne(id);
    if (dto.type === 'OUT') {
      const stock = await this.getStock(id);
      if (dto.qty > stock) throw new BadRequestException('Недостаточно остатков');
    }
    return this.prisma.materialMovement.create({
      data: { materialId: id, ...dto, actorId, actorName },
      include: { material: true },
    });
  }

  async getHistory(id: string, query: PaginationDto) {
    const { page = 1, limit = 50 } = query;
    const [items, total] = await Promise.all([
      this.prisma.materialMovement.findMany({
        where: { materialId: id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.materialMovement.count({ where: { materialId: id } }),
    ]);
    return { items, total, page, limit };
  }
}
