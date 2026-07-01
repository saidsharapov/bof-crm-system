import { IsString, IsOptional, IsArray, ValidateNested, IsInt, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class MaterialItem {
  @ApiProperty() @IsString() materialId: string;
  @ApiProperty() @IsNumber() @IsPositive() qty: number;
}

class ProductItem {
  @ApiProperty() @IsString() productId: string;
  @ApiProperty() @IsInt() @IsPositive() qty: number;
}

export class CreateProductionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;

  @ApiProperty({ type: [MaterialItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialItem)
  materials: MaterialItem[];

  @ApiProperty({ type: [ProductItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductItem)
  products: ProductItem[];
}
