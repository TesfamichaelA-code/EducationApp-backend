import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ResourceType } from '../schemas/resource.schema';

export class CreateResourceDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty({ enum: ResourceType })
  @IsEnum(ResourceType)
  type: ResourceType;

  @ApiProperty()
  @IsString()
  course: string;
}
