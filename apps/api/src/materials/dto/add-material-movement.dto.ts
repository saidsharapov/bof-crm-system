import { IsString, IsNumber, IsPositive, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddMaterialMovementDto {
  @ApiProperty({ enum: ['IN', 'OUT'] }) @IsIn(['IN', 'OUT']) type: string;
  @ApiProperty() @IsNumber() @IsPositive() qty: number;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
}
