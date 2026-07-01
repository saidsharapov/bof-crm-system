import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AddProductMovementDto } from './dto/add-product-movement.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Warehouse')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('warehouse')
export class WarehouseController {
  constructor(private warehouse: WarehouseService) {}

  @Get('stock')
  @ApiOperation({ summary: 'Get all products with stock levels' })
  getStock(@Query() query: PaginationDto & { lowStock?: boolean }) {
    return this.warehouse.getStockList(query);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Product movements journal' })
  getMovements(@Query() query: PaginationDto & { productId?: string; type?: string }) {
    return this.warehouse.getProductMovements(query);
  }

  @Post('movements')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.WAREHOUSE)
  @ApiOperation({ summary: 'Add product movement (IN/OUT)' })
  addMovement(@Body() dto: AddProductMovementDto, @CurrentUser() user: any) {
    return this.warehouse.addProductMovement(dto, user.id, user.name);
  }
}
