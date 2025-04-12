import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Note extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course' })
  course?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Resource' })
  resource?: string;

  @Prop({ default: true })
  isPrivate: boolean;
}

export const NoteSchema = SchemaFactory.createForClass(Note);
