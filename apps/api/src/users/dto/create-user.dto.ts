import { IsString, MinLength, MaxLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty() @IsString() @MinLength(1) login: string;
  @ApiProperty() @IsString() @MinLength(1) name: string;
  @ApiProperty() @IsString() @MinLength(4) @MaxLength(64) password: string;
  @ApiProperty({ enum: Role }) @IsEnum(Role) role: Role;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
}
