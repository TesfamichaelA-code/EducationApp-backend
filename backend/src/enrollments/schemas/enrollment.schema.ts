/**
 * Enrollment — many-to-many bridge between a Course and a student User.
 *
 * Unique compound index on (courseId, studentId) prevents duplicate
 * enrollments at the database layer.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { baseSchemaOptions } from '../../common/database/base-schema';

@Schema(baseSchemaOptions)
export class Enrollment {
  @Prop({ required: true, index: true })
  courseId!: string;

  @Prop({ required: true, index: true })
  studentId!: string;

  @Prop({ required: true, default: () => new Date() })
  joinedAt!: Date;
}

export type EnrollmentDocument = HydratedDocument<Enrollment>;
export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
EnrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });
