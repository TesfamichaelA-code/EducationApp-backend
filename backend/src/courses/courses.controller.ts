import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserDocument, UserRole } from '../users/schemas/user.schema';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiTags('courses')
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a course (teacher/admin)' })
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateCourseDto) {
    return this.courses.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all courses' })
  list() {
    return this.courses.findAll();
  }

  @Get('mine')
  @ApiOperation({ summary: 'Courses owned by the current user' })
  mine(@CurrentUser() user: UserDocument) {
    return this.courses.findByTeacher(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course by id' })
  findOne(@Param('id') id: string) {
    return this.courses.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a course (owner/admin)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.courses.update(id, user.id, user.role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a course (owner/admin)' })
  async remove(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    await this.courses.remove(id, user.id, user.role);
    return { deleted: true };
  }

  @Post(':id/invite-code/regenerate')
  @ApiOperation({ summary: 'Rotate the invite code (owner/admin)' })
  regenerate(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.courses.regenerateInviteCode(id, user.id, user.role);
  }
}
