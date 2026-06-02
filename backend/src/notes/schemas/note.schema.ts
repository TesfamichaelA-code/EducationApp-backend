/**
 * Note schema — personal markdown notes, optionally linked to a course.
 *
 *   • isPrivate=true (default) → only the author can read
 *   • isPrivate=false + courseId → visible to enrolled students + teacher
 *   • text index on title+content for full-text search
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { baseSchemaOptions } from '../../common/database/base-schema';

@Schema(baseSchemaOptions)
export class Note {
  @Prop({ required: true, index: true })
  authorId!: string;

  /** Optional — if set, the note is contextualized to that course. */
  @Prop({ index: true })
  courseId?: string;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title!: string;

  /** Markdown body. Capped at 100k to prevent runaway blobs. */
  @Prop({ default: '', maxlength: 100_000 })
  content!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ default: false })
  pinned!: boolean;

  @Prop({ default: true })
  isPrivate!: boolean;
}

export type NoteDocument = HydratedDocument<Note>;
export const NoteSchema = SchemaFactory.createForClass(Note);
NoteSchema.index({ title: 'text', content: 'text' });
