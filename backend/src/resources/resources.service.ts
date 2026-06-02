/**
 * ResourcesService — PDF (and arbitrary file) storage on top of MongoDB GridFS.
 *
 * Why GridFS instead of S3/disk? Zero infra dependencies — GridFS rides on
 * the same Mongo cluster we already operate, files are transactional with
 * their metadata, and there's no external secret to leak. Trade-off: slower
 * than S3 for high-throughput use cases. For a class-sized education app
 * this is perfectly fine; if scale demands it later we can swap the
 * implementation behind this service without touching the controller.
 *
 * Access rules (download):
 *   • the uploader (teacher) — always
 *   • an enrolled student   — always
 *   • any admin             — always
 *   • everyone else         — 403
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Response } from 'express';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Connection, Model } from 'mongoose';

import { CoursesService } from '../courses/courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { UserRole } from '../users/schemas/user.schema';
import { Resource, ResourceDocument } from './schemas/resource.schema';

@Injectable()
export class ResourcesService {
  private bucket?: GridFSBucket;

  constructor(
    @InjectModel(Resource.name) private readonly model: Model<Resource>,
    @InjectConnection() private readonly conn: Connection,
    private readonly courses: CoursesService,
    private readonly enrollments: EnrollmentsService,
  ) {}

  private getBucket(): GridFSBucket {
    if (!this.bucket) {
      if (!this.conn.db) {
        throw new Error('Mongoose connection is not ready');
      }
      this.bucket = new GridFSBucket(this.conn.db, { bucketName: 'resources' });
    }
    return this.bucket;
  }

  async upload(
    courseId: string,
    userId: string,
    role: UserRole,
    file: Express.Multer.File,
  ): Promise<ResourceDocument> {
    if (!file?.buffer) throw new BadRequestException('No file provided');
    const course = await this.courses.findOne(courseId);
    if (course.teacherId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the course owner can upload resources');
    }

    const bucket = this.getBucket();
    const gridfsId = await new Promise<ObjectId>((resolve, reject) => {
      const upload = bucket.openUploadStream(file.originalname, {
        contentType: file.mimetype,
        metadata: { courseId, uploaderId: userId },
      });
      upload.on('error', reject);
      upload.on('finish', () => resolve(upload.id as ObjectId));
      upload.end(file.buffer);
    });

    return this.model.create({
      courseId,
      uploaderId: userId,
      filename: file.originalname,
      gridfsId: gridfsId.toString(),
      mimeType: file.mimetype,
      size: file.size,
    });
  }

  listByCourse(courseId: string): Promise<ResourceDocument[]> {
    return this.model.find({ courseId }).sort({ createdAt: -1 }).exec();
  }

  async streamDownload(
    id: string,
    userId: string,
    role: UserRole,
    res: Response,
  ): Promise<void> {
    const resource = await this.model.findById(id).exec();
    if (!resource) throw new NotFoundException('Resource not found');

    const course = await this.courses.findOne(resource.courseId);
    const enrolled = await this.enrollments.isEnrolled(userId, resource.courseId);
    if (course.teacherId !== userId && !enrolled && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized for this resource');
    }

    res.set({
      'Content-Type': resource.mimeType,
      'Content-Disposition': `inline; filename="${resource.filename}"`,
      'Content-Length': resource.size.toString(),
    });
    const stream = this.getBucket().openDownloadStream(new ObjectId(resource.gridfsId));
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).end();
    });
    stream.pipe(res);
  }

  async delete(id: string, userId: string, role: UserRole): Promise<void> {
    const resource = await this.model.findById(id).exec();
    if (!resource) throw new NotFoundException('Resource not found');
    if (resource.uploaderId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the uploader (or admin) can delete this resource');
    }
    try {
      await this.getBucket().delete(new ObjectId(resource.gridfsId));
    } catch {
      // File missing from GridFS — possible if a previous delete partially failed.
      // Still proceed to remove the metadata row.
    }
    await resource.deleteOne();
  }
}
