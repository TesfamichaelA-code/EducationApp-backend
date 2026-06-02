import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ExplainDto {
  @ApiProperty({
    description: 'A question or topic the learner wants explained.',
    example: 'Why is the sky blue?',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(2_000)
  question!: string;

  @ApiPropertyOptional({
    description: 'Optional course/topic context to bias the explanation.',
    example: 'High-school physics',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  context?: string;
}
