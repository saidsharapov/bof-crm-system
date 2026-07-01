import { IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(100) name: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(50) article: string;
  @ApiProperty() @IsString() @MinLength(1) size: string;
  @ApiProperty() @IsString() @MinLength(1) color: string;
  @ApiProperty() @IsString() @Matches(/^#[0-9A-Fa-f]{6}$/) colorHex: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() photoUrl?: string;
}
