import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CoursesService } from '../courses/courses.service';
import { UserDocument } from '../users/schemas/user.schema';
import { CourseAccessService } from './course-access.service';
import { JoinByCodeDto } from './dto/join.dto';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('enrollments')
@ApiBearerAuth()
@Controller('enrollments')
export class EnrollmentsController {
  constructor(
    private readonly enrollments: EnrollmentsService,
    private readonly courses: CoursesService,
    private readonly access: CourseAccessService,
  ) {}

  @Post('join')
  @ApiOperation({ summary: 'Join a course via invite code' })
  async join(@CurrentUser() user: UserDocument, @Body() dto: JoinByCodeDto) {
    const { enrollment, course } = await this.enrollments.joinByCode(user.id, dto.inviteCode);
    return { enrollment, course: this.courses.toView(course, user.id, user.role) };
  }

  @Get('mine')
  @ApiOperation({ summary: 'Courses I am enrolled in' })
  async mine(@CurrentUser() user: UserDocument) {
    const courses = await this.enrollments.listForStudent(user.id);
    return courses.map((c) => this.courses.toView(c, user.id, user.role));
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Enrollments for a course (owner/admin)' })
  async forCourse(@Param('courseId') courseId: string, @CurrentUser() user: UserDocument) {
    const course = await this.access.assertCanManage(courseId, user.id, user.role);
    return this.enrollments.listForCourse(course.id);
  }

  @Delete('course/:courseId')
  @ApiOperation({ summary: 'Leave a course' })
  async leave(@Param('courseId') courseId: string, @CurrentUser() user: UserDocument) {
    await this.enrollments.leave(user.id, courseId);
    return { left: true };
  }
}
