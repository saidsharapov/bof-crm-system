import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products' })
  findAll(@Query() query: PaginationDto & { size?: string; color?: string }) {
    return this.products.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.products.findOne(id); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.WAREHOUSE)
  create(@Body() dto: CreateProductDto) { return this.products.create(dto); }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.WAREHOUSE)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) { return this.products.remove(id); }
}
