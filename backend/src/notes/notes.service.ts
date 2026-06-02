/**
 * NotesService — author-owned CRUD with full-text search.
 *
 * Access rules:
 *   • author always reads/writes their own notes
 *   • non-author can read iff isPrivate=false AND courseId is set AND
 *     the requester is enrolled in (or teaches) that course
 *     (enforced in the *controller* via EnrollmentsService — keeps this
 *      service storage-focused)
 */

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note, NoteDocument } from './schemas/note.schema';

@Injectable()
export class NotesService {
  constructor(@InjectModel(Note.name) private readonly model: Model<Note>) {}

  create(authorId: string, dto: CreateNoteDto): Promise<NoteDocument> {
    return this.model.create({ ...dto, authorId });
  }

  listMine(authorId: string): Promise<NoteDocument[]> {
    return this.model.find({ authorId }).sort({ pinned: -1, updatedAt: -1 }).exec();
  }

  /** Public notes attached to a course (for enrolled students). */
  listPublicForCourse(courseId: string): Promise<NoteDocument[]> {
    return this.model
      .find({ courseId, isPrivate: false })
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

  async update(id: string, authorId: string, dto: UpdateNoteDto): Promise<NoteDocument> {
    const note = await this.findOne(id);
    if (note.authorId !== authorId) throw new ForbiddenException('Not your note');
    Object.assign(note, dto);
    return note.save();
  }

  async remove(id: string, authorId: string): Promise<void> {
    const note = await this.findOne(id);
    if (note.authorId !== authorId) throw new ForbiddenException('Not your note');
    await note.deleteOne();
  }
}
