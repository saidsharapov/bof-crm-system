import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users (ADMIN)' })
  findAll() { return this.users.findAll(); }

  @Post()
  @ApiOperation({ summary: 'Create user (ADMIN)' })
  create(@Body() dto: CreateUserDto) { return this.users.create(dto); }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (ADMIN)' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) { return this.users.update(id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete user (ADMIN)' })
  remove(@Param('id') id: string) { return this.users.remove(id); }
}
