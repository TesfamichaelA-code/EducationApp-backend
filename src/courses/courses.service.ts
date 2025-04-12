import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course } from './schemas/course.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class CoursesService {
  constructor(@InjectModel(Course.name) private courseModel: Model<Course>) {}

  async create(
    createCourseDto: CreateCourseDto,
    teacherId: string,
  ): Promise<Course> {
    const createdCourse = new this.courseModel({
      ...createCourseDto,
      teacher: teacherId,
      resources: [],
    });
    return createdCourse.save();
  }

  async findAll(user: any): Promise<Course[]> {
    const query: any = {};

    if (user.role === UserRole.TEACHER) {
      query.teacher = user._id;
    } else if (user.role === UserRole.STUDENT) {
      query.students = user._id;
    }

    return this.courseModel
      .find(query)
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .populate('resources', 'title type')
      .exec();
  }

  async findOne(id: string, user: any): Promise<Course> {
    const course = await this.courseModel
      .findById(id)
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .populate('resources', 'title type')
      .exec();

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (user.role === UserRole.STUDENT && !course.students.includes(user._id)) {
      throw new ForbiddenException('Access denied');
    }

    return course;
  }

  async addStudent(
    courseId: string,
    studentId: string,
    user: any,
  ): Promise<Course> {
    const course = await this.courseModel.findById(courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (
      course.teacher.toString() !== user._id &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Access denied');
    }

    if (!course.students.includes(studentId)) {
      course.students.push(studentId);
      await course.save();
    }

    return course;
  }

  async removeStudent(
    courseId: string,
    studentId: string,
    user: any,
  ): Promise<Course> {
    const course = await this.courseModel.findById(courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (
      course.teacher.toString() !== user._id &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Access denied');
    }

    course.students = course.students.filter(
      (id) => id.toString() !== studentId,
    );
    return course.save();
  }

  async delete(id: string, user: any): Promise<void> {
    const course = await this.courseModel.findById(id);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (
      course.teacher.toString() !== user._id &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Access denied');
    }

    await this.courseModel.findByIdAndDelete(id).exec();
  }

  async addResource(courseId: string, resourceId: string, user: any): Promise<Course> {
    const course = await this.courseModel.findById(courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (
      course.teacher.toString() !== user._id &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Access denied');
    }

    if (!course.resources.includes(resourceId)) {
      course.resources.push(resourceId);
      await course.save();
    }

    return course;
  }
}
