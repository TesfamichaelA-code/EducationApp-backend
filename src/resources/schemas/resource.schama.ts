import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum ResourceType {
  PDF = 'pdf',
  DOCUMENT = 'document',
  VIDEO = 'video',
  LINK = 'link',
}

@Schema({ timestamps: true })
export class Resource extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true, enum: ResourceType })
  type: ResourceType;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  uploader: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', required: true })
  course: string;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);
