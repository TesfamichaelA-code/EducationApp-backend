/**
 * CourseAccessService — the single place that decides who may see or manage
 * anything scoped to a course (decks, cards, notes, resources, rosters).
 *
 *   view   → course owner, enrolled student, or admin
 *   manage → course owner or admin
 *
 * Every course-scoped read/write should go through one of these checks.
 */

import { ForbiddenException, Injectable } from '@nestjs/common';

import { CourseDocument } from '../courses/schemas/course.schema';
import { CoursesService } from '../courses/courses.service';
import { UserRole } from '../users/schemas/user.schema';
import { EnrollmentsService } from './enrollments.service';

@Injectable()
export class CourseAccessService {
  constructor(
    private readonly courses: CoursesService,
    private readonly enrollments: EnrollmentsService,
  ) {}

  async assertCanView(courseId: string, userId: string, role: UserRole): Promise<CourseDocument> {
    const course = await this.courses.findOne(courseId);
    if (role === UserRole.ADMIN || course.teacherId === userId) return course;
    if (await this.enrollments.isEnrolled(userId, course.id)) return course;
    throw new ForbiddenException('You are not enrolled in this course');
  }

  async assertCanManage(courseId: string, userId: string, role: UserRole): Promise<CourseDocument> {
    const course = await this.courses.findOne(courseId);
    if (role === UserRole.ADMIN || course.teacherId === userId) return course;
    throw new ForbiddenException('Only the course owner (or an admin) may do this');
  }
}
