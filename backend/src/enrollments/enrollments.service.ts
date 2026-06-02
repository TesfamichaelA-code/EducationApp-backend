/**
 * EnrollmentsService — join/leave, listings, membership checks.
 *
 * Membership semantics:
 *   • a teacher cannot enroll in their own course (use case mismatch)
 *   • duplicate enrollment is blocked by the unique compound index AND a
 *     pre-check (cleaner error message)
 *   • `isEnrolled` is the cheap predicate used by content modules
 *     (FlashcardsService, ResourcesService) to gate student access
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CourseDocument } from '../courses/schemas/course.schema';
import { CoursesService } from '../courses/courses.service';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name) private readonly model: Model<Enrollment>,
    private readonly courses: CoursesService,
  ) {}

  async joinByCode(studentId: string, code: string): Promise<{
    enrollment: EnrollmentDocument;
    course: CourseDocument;
  }> {
    const course = await this.courses.findByInviteCode(code);
    if (!course) throw new NotFoundException('Invalid invite code');
    if (course.teacherId === studentId) {
      throw new BadRequestException('Teachers cannot enroll in their own course');
    }
    const existing = await this.model.findOne({ courseId: course.id, studentId }).exec();
    if (existing) throw new ConflictException('Already enrolled');

    const enrollment = await this.model.create({ courseId: course.id, studentId });
    return { enrollment, course };
  }

  async listForStudent(studentId: string): Promise<CourseDocument[]> {
    const enrollments = await this.model.find({ studentId }).exec();
    if (enrollments.length === 0) return [];
    return this.courses.findManyByIds(enrollments.map((e) => e.courseId));
  }

  listForCourse(courseId: string): Promise<EnrollmentDocument[]> {
    return this.model.find({ courseId }).sort({ joinedAt: -1 }).exec();
  }

  async isEnrolled(studentId: string, courseId: string): Promise<boolean> {
    const exists = await this.model.exists({ studentId, courseId });
    return !!exists;
  }

  async leave(studentId: string, courseId: string): Promise<void> {
    const result = await this.model.deleteOne({ studentId, courseId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Not enrolled in this course');
    }
  }
}
