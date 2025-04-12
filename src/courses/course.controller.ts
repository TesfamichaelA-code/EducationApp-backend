import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('courses')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  create(@Request() req, @Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto, req.user._id);
  }

  @Get()
  findAll(@Request() req) {
    return this.coursesService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.coursesService.findOne(id, req.user);
  }

  @Patch(':id/students/:studentId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  addStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Request() req,
  ) {
    return this.coursesService.addStudent(id, studentId, req.user);
  }

  @Delete(':id/students/:studentId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  removeStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Request() req,
  ) {
    return this.coursesService.removeStudent(id, studentId, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.coursesService.delete(id, req.user);
  }
}
