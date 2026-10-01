/**
 * NotesService — author-owned CRUD with full-text search.
 *
 * Access rules:
 *   • author always reads/writes their own notes
 *   • non-author can read iff isPrivate=false AND courseId is set AND
 *     the requester is enrolled in (or teaches) that course
 *   • attaching a note to a course requires being able to view that course,
 *     so nobody can push shared notes into a course they are not part of
 * Course membership is checked via CourseAccessService.
 */

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CourseAccessService } from '../enrollments/course-access.service';
import { UserRole } from '../users/schemas/user.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note, NoteDocument } from './schemas/note.schema';

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Note.name) private readonly model: Model<Note>,
    private readonly access: CourseAccessService,
  ) {}

  async create(authorId: string, role: UserRole, dto: CreateNoteDto): Promise<NoteDocument> {
    if (dto.courseId) await this.access.assertCanView(dto.courseId, authorId, role);
    return this.model.create({ ...dto, authorId });
  }

  listMine(authorId: string): Promise<NoteDocument[]> {
    return this.model.find({ authorId }).sort({ pinned: -1, updatedAt: -1 }).exec();
  }

  /** Public notes attached to a course (for enrolled students). */
  async listPublicForCourse(
    courseId: string,
    userId: string,
    role: UserRole,
  ): Promise<NoteDocument[]> {
    const course = await this.access.assertCanView(courseId, userId, role);
    return this.model
      .find({ courseId: course.id, isPrivate: false })
      .sort({ pinned: -1, updatedAt: -1 })
      .exec();
  }

  /** Full-text search across the caller's own notes. */
  search(authorId: string, query: string): Promise<NoteDocument[]> {
    return this.model
      .find({ authorId, $text: { $search: query } }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(50)
      .exec();
  }

  async findOne(id: string): Promise<NoteDocument> {
    const note = await this.model.findById(id).exec();
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  /** Author, or a member of the course for a shared (non-private) course note. */
  async findViewable(id: string, userId: string, role: UserRole): Promise<NoteDocument> {
    const note = await this.findOne(id);
    if (note.authorId === userId) return note;
    if (note.isPrivate || !note.courseId) {
      // Don't leak existence — same response as a missing note.
      throw new NotFoundException('Note not found');
    }
    await this.access.assertCanView(note.courseId, userId, role);
    return note;
  }

  async update(
    id: string,
    authorId: string,
    role: UserRole,
    dto: UpdateNoteDto,
  ): Promise<NoteDocument> {
    const note = await this.findOne(id);
    if (note.authorId !== authorId) throw new ForbiddenException('Not your note');
    if (dto.courseId) await this.access.assertCanView(dto.courseId, authorId, role);
    Object.assign(note, dto);
    return note.save();
  }

  async remove(id: string, authorId: string): Promise<void> {
    const note = await this.findOne(id);
    if (note.authorId !== authorId) throw new ForbiddenException('Not your note');
    await note.deleteOne();
  }
}
