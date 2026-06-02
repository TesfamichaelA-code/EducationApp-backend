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
import { UserDocument } from '../users/schemas/user.schema';
import { JoinByCodeDto } from './dto/join.dto';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('enrollments')
@ApiBearerAuth()
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Post('join')
  @ApiOperation({ summary: 'Join a course via invite code' })
  join(@CurrentUser() user: UserDocument, @Body() dto: JoinByCodeDto) {
    return this.enrollments.joinByCode(user.id, dto.inviteCode);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Courses I am enrolled in' })
  mine(@CurrentUser() user: UserDocument) {
    return this.enrollments.listForStudent(user.id);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Enrollments for a course (teacher dashboard)' })
  forCourse(@Param('courseId') courseId: string) {
    return this.enrollments.listForCourse(courseId);
  }

  @Delete('course/:courseId')
  @ApiOperation({ summary: 'Leave a course' })
  async leave(@Param('courseId') courseId: string, @CurrentUser() user: UserDocument) {
    await this.enrollments.leave(user.id, courseId);
    return { left: true };
  }
}
