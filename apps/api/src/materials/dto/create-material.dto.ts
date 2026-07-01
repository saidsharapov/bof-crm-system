import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(100) name: string;
  @ApiProperty() @IsString() @MinLength(1) unit: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) description?: string;
}
