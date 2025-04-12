import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  create(@Body() createCourseDto: CreateCourseDto, @Request() req) {
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

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.coursesService.delete(id, req.user);
  }

  @Post(':id/students/:studentId')
  addStudent(
    @Param('id') courseId: string,
    @Param('studentId') studentId: string,
    @Request() req,
  ) {
    return this.coursesService.addStudent(courseId, studentId, req.user);
  }

  @Delete(':id/students/:studentId')
  removeStudent(
    @Param('id') courseId: string,
    @Param('studentId') studentId: string,
    @Request() req,
  ) {
    return this.coursesService.removeStudent(courseId, studentId, req.user);
  }

  @Post(':id/resources/:resourceId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  addResource(
    @Param('id') courseId: string,
    @Param('resourceId') resourceId: string,
    @Request() req,
  ) {
    return this.coursesService.addResource(courseId, resourceId, req.user);
  }
} 