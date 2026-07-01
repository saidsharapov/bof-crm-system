import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { MaterialsModule } from './materials/materials.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { ProductionModule } from './production/production.module';
import { OrdersModule } from './orders/orders.module';
import { OrderSourcesModule } from './order-sources/order-sources.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    MaterialsModule,
    WarehouseModule,
    ProductionModule,
    OrdersModule,
    OrderSourcesModule,
    DashboardModule,
  ],
})
export class AppModule {}
