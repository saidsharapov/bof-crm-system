import { IsString, IsInt, IsPositive, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddProductMovementDto {
  @ApiProperty() @IsString() productId: string;
  @ApiProperty({ enum: ['IN', 'OUT'] }) @IsIn(['IN', 'OUT']) type: string;
  @ApiProperty() @IsInt() @IsPositive() qty: number;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
}
