import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, OrderStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class SetStatusDto {
  @ApiProperty({ enum: OrderStatus }) @IsEnum(OrderStatus) status: OrderStatus;
}

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List orders' })
  findAll(@Query() query: PaginationDto & { status?: string }) {
    return this.orders.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.orders.findOne(id); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  create(@Body() dto: CreateOrderDto, @CurrentUser('id') userId: string) {
    return this.orders.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.orders.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Set order status' })
  setStatus(@Param('id') id: string, @Body() dto: SetStatusDto, @CurrentUser() user: any) {
    return this.orders.setStatus(id, dto.status, user.id, user.name);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.orders.remove(id); }
}
