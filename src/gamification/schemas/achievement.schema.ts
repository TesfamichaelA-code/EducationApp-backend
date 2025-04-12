import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum AchievementType {
  COMPLETION = 'completion',
  SKILL_MASTERY = 'skill_mastery',
  SPEED = 'speed',
  CONSISTENCY = 'consistency',
  LEADERSHIP = 'leadership',
}

@Schema({ timestamps: true })
export class Achievement extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: AchievementType })
  type: AchievementType;

  @Prop({ required: true })
  criteria: string;

  @Prop({ type: Number, required: true })
  pointsAwarded: number;

  @Prop({ type: String })
  badgeUrl: string;
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement);