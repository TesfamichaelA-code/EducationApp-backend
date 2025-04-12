import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Flashcard extends Document {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  answer: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  creator: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', required: true })
  course: string;

  @Prop()
  tags: string[];
}

export const FlashcardSchema = SchemaFactory.createForClass(Flashcard);