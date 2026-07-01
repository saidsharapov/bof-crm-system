import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductionService } from './production.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateProductionDto } from './dto/create-production.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Production')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.WAREHOUSE)
@Controller('production')
export class ProductionController {
  constructor(private production: ProductionService) {}

  @Get()
  @ApiOperation({ summary: 'List production operations' })
  findAll(@Query() query: PaginationDto) { return this.production.findAll(query); }

  @Post()
  @ApiOperation({ summary: 'Create production operation' })
  create(@Body() dto: CreateProductionDto, @CurrentUser() user: any) {
    return this.production.create(dto, user.id, user.name);
  }
}
