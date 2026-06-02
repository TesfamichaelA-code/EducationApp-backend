import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@learndeck.app' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ChangeMe!2026' })
  @IsString()
  @MinLength(1)
  password!: string;
}
