import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum AssessmentType {
  PRACTICAL = 'practical',
  THEORETICAL = 'theoretical',
  PEER_REVIEW = 'peer_review',
  SUPERVISOR_EVALUATION = 'supervisor_evaluation',
}

@Schema({ timestamps: true })
export class SkillAssessment extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: string;

  @Prop({ required: true })
  skillName: string;

  @Prop({ required: true, enum: AssessmentType })
  type: AssessmentType;

  @Prop({ type: Number, min: 0, max: 100, required: true })
  score: number;

  @Prop({ type: String })
  feedback: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  assessor: string;

  @Prop({ type: Date })
  validUntil: Date;
}

export const SkillAssessmentSchema = SchemaFactory.createForClass(SkillAssessment);