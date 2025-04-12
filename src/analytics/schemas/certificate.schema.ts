import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum CertificateType {
  COURSE_COMPLETION = 'course_completion',
  SKILL_MASTERY = 'skill_mastery',
  COMPLIANCE = 'compliance',
  ACHIEVEMENT = 'achievement',
}

@Schema({ timestamps: true })
export class Certificate extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, enum: CertificateType })
  type: CertificateType;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Date, required: true })
  issueDate: Date;

  @Prop({ type: Date })
  expiryDate?: Date;

  @Prop({ type: String, required: true, unique: true })
  certificateNumber: string;

  @Prop({ type: Boolean, default: true })
  isValid: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata: any;
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);