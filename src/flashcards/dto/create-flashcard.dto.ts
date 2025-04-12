import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFlashcardDto {
  @ApiProperty()
  @IsString()
  question: string;

  @ApiProperty()
  @IsString()
  answer: string;

  @ApiProperty()
  @IsString()
  course: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  tags?: string[];
}
