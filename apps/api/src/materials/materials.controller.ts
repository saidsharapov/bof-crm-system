import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { AddMaterialMovementDto } from './dto/add-material-movement.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Materials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('materials')
export class MaterialsController {
  constructor(private materials: MaterialsService) {}

  @Get()
  findAll(@Query() query: PaginationDto) { return this.materials.findAll(query); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.materials.findOne(id); }

  @Get(':id/stock')
  getStock(@Param('id') id: string) { return this.materials.getStock(id).then(qty => ({ qty })); }

  @Get(':id/movements')
  getHistory(@Param('id') id: string, @Query() query: PaginationDto) {
    return this.materials.getHistory(id, query);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.WAREHOUSE)
  create(@Body() dto: CreateMaterialDto) { return this.materials.create(dto); }

  @Post(':id/movements')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.WAREHOUSE)
  addMovement(@Param('id') id: string, @Body() dto: AddMaterialMovementDto, @CurrentUser() user: any) {
    return this.materials.addMovement(id, dto, user.id, user.name);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.WAREHOUSE)
  update(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.materials.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) { return this.materials.remove(id); }
}
