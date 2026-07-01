import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty() @IsString() current: string;
  @ApiProperty() @IsString() @MinLength(4) @MaxLength(64) next: string;
}
