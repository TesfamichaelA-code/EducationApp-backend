import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Prop({ type: [{ type: String, ref: 'Course' }] })
  enrolledCourses: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
