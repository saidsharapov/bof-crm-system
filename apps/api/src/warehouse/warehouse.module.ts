import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  providers: [WarehouseService],
  controllers: [WarehouseController],
  exports: [WarehouseService],
})
export class WarehouseModule {}
