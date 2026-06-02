/**
 * CoursesService — CRUD + ownership enforcement + invite-code generation.
 *
 * Authorization model:
 *   • create  — TEACHER or ADMIN (enforced at controller via @Roles)
 *   • read    — any authed user
 *   • update/delete/regenerate-code — owner or ADMIN (enforced here)
 *
 * Invite codes are 8-character uppercase hex (4 random bytes), collision-
 * checked with a small retry loop. Probability of collision with even 10k
 * courses is < 1 in 400k — five attempts is more than enough.
 */

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model } from 'mongoose';

import { UserRole } from '../users/schemas/user.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course, CourseDocument } from './schemas/course.schema';

@Injectable()
export class CoursesService {
  constructor(@InjectModel(Course.name) private readonly model: Model<Course>) {}

  private newInviteCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  async create(teacherId: string, dto: CreateCourseDto): Promise<CourseDocument> {
    let inviteCode = this.newInviteCode();
    for (let i = 0; i < 5; i += 1) {
      const clash = await this.model.exists({ inviteCode });
      if (!clash) break;
      inviteCode = this.newInviteCode();
    }
    return this.model.create({ ...dto, teacherId, inviteCode });
  }

  findAll(): Promise<CourseDocument[]> {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<CourseDocument> {
    const course = await this.model.findById(id).exec();
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  findByTeacher(teacherId: string): Promise<CourseDocument[]> {
    return this.model.find({ teacherId }).sort({ createdAt: -1 }).exec();
  }

  findByInviteCode(code: string): Promise<CourseDocument | null> {
    return this.model.findOne({ inviteCode: code.toUpperCase() }).exec();
  }

  findManyByIds(ids: string[]): Promise<CourseDocument[]> {
    return this.model.find({ _id: { $in: ids } }).exec();
  }

  async update(
    id: string,
    userId: string,
    role: UserRole,
    dto: UpdateCourseDto,
  ): Promise<CourseDocument> {
    const course = await this.findOne(id);
    this.assertOwnership(course, userId, role);
    Object.assign(course, dto);
    return course.save();
  }

  async remove(id: string, userId: string, role: UserRole): Promise<void> {
    const course = await this.findOne(id);
    this.assertOwnership(course, userId, role);
    await course.deleteOne();
  }

  async regenerateInviteCode(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<CourseDocument> {
    const course = await this.findOne(id);
    this.assertOwnership(course, userId, role);
    course.inviteCode = this.newInviteCode();
    return course.save();
  }

  private assertOwnership(course: CourseDocument, userId: string, role: UserRole): void {
    if (course.teacherId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the course owner (or an admin) may do this');
    }
  }
}
