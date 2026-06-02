/**
 * Course — top-level container for a teacher's class.
 *
 * Indexes:
 *   • teacherId (queries: "courses I teach")
 *   • inviteCode unique (enrollment lookup)
 *   • text index on title+description (search)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { baseSchemaOptions } from '../../common/database/base-schema';

@Schema(baseSchemaOptions)
export class Course {
  @Prop({ required: true, trim: true, maxlength: 120 })
  title!: string;

  @Prop({ default: '', maxlength: 2_000 })
  description!: string;

  @Prop({ default: '' })
  coverUrl!: string;

  @Prop({ default: 'General', maxlength: 60 })
  category!: string;

  /** Owning teacher (User._id). */
  @Prop({ required: true, index: true })
  teacherId!: string;

  /** 8-char uppercase hex token used by students to enroll. */
  @Prop({ required: true, unique: true, index: true, uppercase: true })
  inviteCode!: string;

  @Prop({ default: false })
  published!: boolean;
}

export type CourseDocument = HydratedDocument<Course>;
export const CourseSchema = SchemaFactory.createForClass(Course);
CourseSchema.index({ title: 'text', description: 'text' });
