import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('resources')
@Controller('resources')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  create(@Request() req, @Body() createResourceDto: CreateResourceDto) {
    return this.resourcesService.create(createResourceDto, req.user._id);
  }

  @Get()
  findAll(@Request() req) {
    return this.resourcesService.findAll(req.user);
  }

  @Get('course/:courseId')
  findByCourse(@Param('courseId') courseId: string) {
    return this.resourcesService.findByCourse(courseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateResourceDto: any,
    @Request() req,
  ) {
    return this.resourcesService.update(id, updateResourceDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.resourcesService.remove(id, req.user);
  }
}
