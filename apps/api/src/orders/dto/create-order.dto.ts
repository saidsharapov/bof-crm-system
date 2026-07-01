import { IsString, IsOptional, IsArray, ValidateNested, IsInt, IsNumber, IsPositive, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty() @IsString() productId: string;
  @ApiProperty() @IsInt() @IsPositive() qty: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() price?: number;
}

export class CreateOrderDto {
  @ApiProperty() @IsString() @MinLength(1) clientName: string;
  @ApiProperty() @IsString() @MinLength(1) phone: string;
  @ApiProperty() @IsString() @MinLength(1) address: string;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() deadline?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
