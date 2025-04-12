import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Course extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  teacher: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  students: string[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Resource' }] })
  resources: string[];
}

export const CourseSchema = SchemaFactory.createForClass(Course);
