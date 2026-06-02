import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class FlashcardsFromTextDto {
  @ApiProperty({
    description: 'Study material to convert into Q/A pairs.',
    example: 'Photosynthesis is the process by which plants ...',
  })
  @IsString()
  @MinLength(20)
  @MaxLength(20_000)
  text!: string;

  @ApiPropertyOptional({
    description: 'How many cards to generate (max 30).',
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  count?: number;

  @ApiPropertyOptional({
    description:
      'Optional deck id — if set, the generated cards are persisted into that deck (caller must own it).',
  })
  @IsOptional()
  @IsString()
  deckId?: string;
}
