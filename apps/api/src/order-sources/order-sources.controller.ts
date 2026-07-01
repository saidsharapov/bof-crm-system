import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrderSourcesService } from './order-sources.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateSourceDto {
  @ApiProperty() @IsString() name: string;
}
class UpdateSourceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() archived?: boolean;
}

@ApiTags('Order Sources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('order-sources')
export class OrderSourcesController {
  constructor(private sources: OrderSourcesService) {}

  @Get()
  @ApiOperation({ summary: 'List order sources' })
  findAll(@Query('all') all?: string) { return this.sources.findAll(all === 'true'); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateSourceDto) { return this.sources.create(dto.name); }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateSourceDto) {
    return this.sources.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) { return this.sources.remove(id); }
}
