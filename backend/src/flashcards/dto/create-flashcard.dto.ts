import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateFlashcardDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(1_000)
  question!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2_000)
  answer!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  hint?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];
}
