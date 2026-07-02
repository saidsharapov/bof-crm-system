import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private products: ProductsService,
  ) {}

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      ordersToday,
      ordersWeek,
      ordersActive,
      revenueWeek,
    ] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: today }, deletedAt: null } }),
      this.prisma.order.count({ where: { createdAt: { gte: weekAgo }, deletedAt: null } }),
      this.prisma.order.count({ where: { status: { in: ['NEW', 'IN_WORK', 'DELIVERING'] }, deletedAt: null } }),
      this.prisma.order.aggregate({
        where: { status: 'DELIVERED', updatedAt: { gte: weekAgo }, deletedAt: null },
        _sum: { totalAmount: true },
      }),
    ]);

    const chart = await this.getWeeklyChart();
    const lowStockCount = await this.getLowStockCount();

    const recentOrders = await this.prisma.order.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { items: { include: { product: true } }, source: true },
    });

    const [prodMovements, matMovements] = await Promise.all([
      this.prisma.productMovement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { product: true },
      }),
      this.prisma.materialMovement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { material: true },
      }),
    ]);

    const recentMovements = [
      ...prodMovements.map(m => ({ ...m, _source: 'product' as const })),
      ...matMovements.map(m => ({ ...m, _source: 'material' as const })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      kpi: {
        ordersToday,
        ordersWeek,
        ordersActive,
        revenueWeek: revenueWeek._sum.totalAmount ?? 0,
        lowStockCount,
      },
      chart,
      recentOrders,
      recentMovements,
    };
  }

  private async getWeeklyChart() {
    const days: { day: string; orders: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const [orders, revenue] = await Promise.all([
        this.prisma.order.count({ where: { createdAt: { gte: d, lt: next }, deletedAt: null } }),
        this.prisma.order.aggregate({
          where: { status: 'DELIVERED', updatedAt: { gte: d, lt: next }, deletedAt: null },
          _sum: { totalAmount: true },
        }),
      ]);

      days.push({
        day: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
        orders,
        revenue: revenue._sum.totalAmount ?? 0,
      });
    }
    return days;
  }

  private async getLowStockCount(): Promise<number> {
    const [products, stockAgg] = await Promise.all([
      this.prisma.product.findMany({ where: { deletedAt: null }, select: { id: true } }),
      this.prisma.productMovement.groupBy({ by: ['productId', 'type'], _sum: { qty: true } }),
    ]);
    const stockMap: Record<string, number> = {};
    for (const row of stockAgg) {
      if (!stockMap[row.productId]) stockMap[row.productId] = 0;
      if (row.type === 'IN' || row.type === 'PRODUCE' || row.type === 'RETURN') stockMap[row.productId] += row._sum.qty ?? 0;
      if (row.type === 'OUT' || row.type === 'SHIP' || row.type === 'RESERVE') stockMap[row.productId] -= row._sum.qty ?? 0;
    }
    return products.filter(p => Math.max(0, stockMap[p.id] ?? 0) <= 5).length;
  }
}
