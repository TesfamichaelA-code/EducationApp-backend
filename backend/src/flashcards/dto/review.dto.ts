import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class ReviewDto {
  @ApiProperty({
    minimum: 0,
    maximum: 5,
    description: 'SM-2 quality grade: 0=blackout … 5=perfect recall',
  })
  @IsInt()
  @Min(0)
  @Max(5)
  quality!: number;
}
