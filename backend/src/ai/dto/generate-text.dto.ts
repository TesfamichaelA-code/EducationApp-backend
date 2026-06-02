/**
 * Request body for POST /api/ai/generate — the smoke-test endpoint that proves
 * the LLM provider is reachable end-to-end.
 *
 * Feature-specific DTOs (flashcard generation, quiz generation, learning-path
 * suggestions) live next to the modules that consume them; this one is
 * deliberately generic so we can curl Gemini directly.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class GenerateTextDto {
  @ApiProperty({
    description: 'User prompt to send to the LLM.',
    example: 'Explain photosynthesis in one paragraph for a 10-year-old.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  prompt!: string;

  @ApiPropertyOptional({
    description: 'Optional system-level instruction (persona / formatting rules).',
    example: 'You are an expert tutor who answers in plain language.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  systemInstruction?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 2, default: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ minimum: 16, maximum: 8192, default: 1024 })
  @IsOptional()
  @IsNumber()
  @Min(16)
  @Max(8192)
  maxOutputTokens?: number;
}
