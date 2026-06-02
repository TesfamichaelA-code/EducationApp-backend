import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class JoinByCodeDto {
  @ApiProperty({ example: 'A4F2KL12' })
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  inviteCode!: string;
}
