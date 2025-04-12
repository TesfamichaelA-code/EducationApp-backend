import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ResourceDocument = Resource & Document;

export enum ResourceType {
  VIDEO = 'video',
  ARTICLE = 'article',
  DOCUMENT = 'document',
  LINK = 'link',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Resource {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true, enum: ResourceType })
  type: ResourceType;

  @Prop({ required: true })
  url: string;

  @Prop()
  tags: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course' })
  course: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  uploader: string;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource); 