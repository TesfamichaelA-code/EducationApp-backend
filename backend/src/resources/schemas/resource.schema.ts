/**
 * Resource — metadata for a file stored in GridFS.
 *
 * The actual bytes live in the `resources.files` / `resources.chunks` GridFS
 * collections, keyed by `gridfsId`. This document carries only the metadata
 * the application cares about (ownership, MIME, original filename).
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { baseSchemaOptions } from '../../common/database/base-schema';

@Schema(baseSchemaOptions)
export class Resource {
  @Prop({ required: true, index: true })
  courseId!: string;

  @Prop({ required: true })
  uploaderId!: string;

  @Prop({ required: true, trim: true })
  filename!: string;

  /** ObjectId in the `resources.files` GridFS collection, stringified. */
  @Prop({ required: true })
  gridfsId!: string;

  @Prop({ required: true })
  mimeType!: string;

  @Prop({ required: true })
  size!: number;
}

export type ResourceDocument = HydratedDocument<Resource>;
export const ResourceSchema = SchemaFactory.createForClass(Resource);
