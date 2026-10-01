/**
 * ResourcesService — course file storage on top of MongoDB GridFS.
 *
 * Why GridFS instead of S3/disk? Zero infra dependencies — GridFS rides on
 * the same Mongo cluster we already operate, files are transactional with
 * their metadata, and there's no external secret to leak. Trade-off: slower
 * than S3 for high-throughput use cases. For a class-sized education app
 * this is perfectly fine; if scale demands it later we can swap the
 * implementation behind this service without touching the controller.
 *
 * Access rules:
 *   • upload          — course owner or admin
 *   • list / download — course owner, enrolled student, or admin
 *   • delete          — uploader or admin
 *
 * Upload safety: only an allow-list of document/image types is accepted, and
 * downloads are served with nosniff + a sandboxing CSP so a file can never
 * execute script on the API origin (stored XSS), whatever its real contents.
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Response } from 'express';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Connection, Model } from 'mongoose';

import { CourseAccessService } from '../enrollments/course-access.service';
import { UserRole } from '../users/schemas/user.schema';
import { Resource, ResourceDocument } from './schemas/resource.schema';

/** MIME types teachers may upload. Anything else is rejected with 415. */
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.ms-powerpoint',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

/** Types the browser may display in-tab; everything else is a download. */
const INLINE_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]);

const MAX_FILENAME_LENGTH = 200;

/**
 * Normalize a client filename: multer/busboy decodes the multipart header as
 * latin1, so UTF-8 names (e.g. "Résumé.pdf") arrive garbled — re-decode them.
 * Then strip path components and control characters.
 */
function sanitizeFilename(raw: string): string {
  const name = Buffer.from(raw, 'latin1').toString('utf8');
  const base = name.split(/[\\/]/).pop() ?? '';
  // eslint-disable-next-line no-control-regex
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return (cleaned || 'file').slice(0, MAX_FILENAME_LENGTH);
}

/** RFC 6266 Content-Disposition with an ASCII fallback + UTF-8 filename*. */
function contentDisposition(type: 'inline' | 'attachment', filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

@Injectable()
export class ResourcesService {
  private bucket?: GridFSBucket;

  constructor(
    @InjectModel(Resource.name) private readonly model: Model<Resource>,
    @InjectConnection() private readonly conn: Connection,
    private readonly access: CourseAccessService,
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
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new UnsupportedMediaTypeException(
        'Unsupported file type. Upload a PDF, image, text, or Office document.',
      );
    }
    const course = await this.access.assertCanManage(courseId, userId, role);
    const filename = sanitizeFilename(file.originalname);

    const bucket = this.getBucket();
    const gridfsId = await new Promise<ObjectId>((resolve, reject) => {
      const upload = bucket.openUploadStream(filename, {
        contentType: file.mimetype,
        metadata: { courseId: course.id, uploaderId: userId },
      });
      upload.on('error', reject);
      upload.on('finish', () => resolve(upload.id as ObjectId));
      upload.end(file.buffer);
    });

    return this.model.create({
      courseId: course.id,
      uploaderId: userId,
      filename,
      gridfsId: gridfsId.toString(),
      mimeType: file.mimetype,
      size: file.size,
    });
  }

  async listByCourse(courseId: string, userId: string, role: UserRole): Promise<ResourceDocument[]> {
    const course = await this.access.assertCanView(courseId, userId, role);
    return this.model.find({ courseId: course.id }).sort({ createdAt: -1 }).exec();
  }

  async streamDownload(
    id: string,
    userId: string,
    role: UserRole,
    res: Response,
  ): Promise<void> {
    const resource = await this.model.findById(id).exec();
    if (!resource) throw new NotFoundException('Resource not found');
    await this.access.assertCanView(resource.courseId, userId, role);

    // Rows uploaded before the allow-list existed may carry any type; serve
    // those as opaque downloads.
    const mimeType = ALLOWED_MIME_TYPES.has(resource.mimeType)
      ? resource.mimeType
      : 'application/octet-stream';
    const inline = INLINE_MIME_TYPES.has(mimeType);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': contentDisposition(inline ? 'inline' : 'attachment', resource.filename),
      'Content-Length': resource.size.toString(),
      'X-Content-Type-Options': 'nosniff',
      // Chrome's PDF viewer refuses to render under a `sandbox` CSP, so PDFs
      // get a no-script policy instead; nosniff stops type confusion either way.
      'Content-Security-Policy':
        mimeType === 'application/pdf'
          ? "default-src 'none'; object-src 'self'; style-src 'unsafe-inline'"
          : "default-src 'none'; sandbox",
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
