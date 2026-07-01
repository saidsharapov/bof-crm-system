import { Module } from '@nestjs/common';
import { OrderSourcesService } from './order-sources.service';
import { OrderSourcesController } from './order-sources.controller';

@Module({
  providers: [OrderSourcesService],
  controllers: [OrderSourcesController],
  exports: [OrderSourcesService],
})
export class OrderSourcesModule {}
