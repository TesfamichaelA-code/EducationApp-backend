import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  course?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  resource?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}