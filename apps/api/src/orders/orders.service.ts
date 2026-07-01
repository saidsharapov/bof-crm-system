import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private products: ProductsService,
  ) {}

  private async generateNum(): Promise<string> {
    const count = await this.prisma.order.count();
    return `#${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: PaginationDto & { status?: string }) {
    const { page = 1, limit = 20, search, status } = query;
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { num: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: { include: { product: true } },
          source: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: { items: { include: { product: true } }, source: true },
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    return order;
  }

  async create(dto: CreateOrderDto, createdById: string) {
    // Reserve stock for NEW orders
    for (const item of dto.items) {
      const stock = await this.products.getStock(item.productId);
      if (item.qty > stock) {
        const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
        throw new BadRequestException(`Недостаточно товара: ${product?.name ?? item.productId}`);
      }
    }

    const num = await this.generateNum();
    const totalAmount = dto.items.reduce((acc, i) => acc + i.qty * (i.price ?? 0), 0);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          num,
          clientName: dto.clientName,
          phone: dto.phone,
          address: dto.address,
          comment: dto.comment ?? '',
          sourceId: dto.sourceId,
          deadline: dto.deadline ? new Date(dto.deadline) : null,
          totalAmount,
          createdById,
          items: {
            create: dto.items.map(i => ({
              productId: i.productId,
              qty: i.qty,
              price: i.price ?? 0,
            })),
          },
        },
        include: { items: { include: { product: true } }, source: true },
      });

      // Reserve stock
      for (const item of dto.items) {
        await tx.productMovement.create({
          data: {
            productId: item.productId,
            type: 'RESERVE',
            qty: item.qty,
            comment: `Резерв под заказ ${num}`,
            orderId: order.id,
          },
        });
      }

      return order;
    });
  }

  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.findOne(id);
    if (order.status !== 'NEW' && order.status !== 'IN_WORK') {
      throw new BadRequestException('Нельзя редактировать заказ в этом статусе');
    }

    const totalAmount = dto.items
      ? dto.items.reduce((acc, i) => acc + i.qty * (i.price ?? 0), 0)
      : order.totalAmount;

    return this.prisma.$transaction(async (tx) => {
      if (dto.items) {
        // Release old reserves
        await tx.productMovement.deleteMany({ where: { orderId: id, type: 'RESERVE' } });
        await tx.orderItem.deleteMany({ where: { orderId: id } });

        // Validate new stock
        for (const item of dto.items) {
          const stock = await this.products.getStock(item.productId);
          if (item.qty > stock) {
            const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
            throw new BadRequestException(`Недостаточно товара: ${product?.name}`);
          }
        }

        // Create new items and reserves
        await tx.orderItem.createMany({
          data: dto.items.map(i => ({ orderId: id, productId: i.productId, qty: i.qty, price: i.price ?? 0 })),
        });
        for (const item of dto.items) {
          await tx.productMovement.create({
            data: {
              productId: item.productId,
              type: 'RESERVE',
              qty: item.qty,
              comment: `Резерв под заказ ${order.num}`,
              orderId: id,
            },
          });
        }
      }

      return tx.order.update({
        where: { id },
        data: {
          clientName: dto.clientName,
          phone: dto.phone,
          address: dto.address,
          comment: dto.comment,
          sourceId: dto.sourceId,
          deadline: dto.deadline ? new Date(dto.deadline) : undefined,
          totalAmount,
        },
        include: { items: { include: { product: true } }, source: true },
      });
    });
  }

  async setStatus(id: string, status: OrderStatus, actorId: string, actorName: string) {
    const order = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // DELIVERED: release reserve + write SHIP movements
      if (status === OrderStatus.DELIVERED) {
        await tx.productMovement.deleteMany({ where: { orderId: id, type: 'RESERVE' } });
        for (const item of order.items) {
          await tx.productMovement.create({
            data: {
              productId: item.productId,
              type: 'SHIP',
              qty: item.qty,
              comment: `Отгрузка заказа ${order.num}`,
              actorId,
              actorName,
              orderId: id,
            },
          });
        }
      }

      // CANCELED after DELIVERED: return stock
      if (status === OrderStatus.CANCELED && order.status === OrderStatus.DELIVERED) {
        for (const item of order.items) {
          await tx.productMovement.create({
            data: {
              productId: item.productId,
              type: 'RETURN',
              qty: item.qty,
              comment: `Возврат по заказу ${order.num}`,
              actorId,
              actorName,
              orderId: id,
            },
          });
        }
      }

      // CANCELED before DELIVERED: release reserve
      if (status === OrderStatus.CANCELED && order.status !== OrderStatus.DELIVERED) {
        await tx.productMovement.deleteMany({ where: { orderId: id, type: 'RESERVE' } });
      }

      return tx.order.update({
        where: { id },
        data: { status },
        include: { items: { include: { product: true } }, source: true },
      });
    });
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    // Release reserves if order is active
    if (order.status === OrderStatus.NEW || order.status === OrderStatus.IN_WORK) {
      await this.prisma.productMovement.deleteMany({ where: { orderId: id, type: 'RESERVE' } });
    }
    await this.prisma.order.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
