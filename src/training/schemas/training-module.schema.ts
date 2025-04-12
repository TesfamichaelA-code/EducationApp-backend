import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum ModuleType {
  CUSTOMER_SERVICE = 'customer_service',
  HOUSEKEEPING = 'housekeeping',
  FOOD_SAFETY = 'food_safety',
  FRONT_DESK = 'front_desk',
  LEADERSHIP = 'leadership',
  CRISIS_MANAGEMENT = 'crisis_management',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

@Schema({ timestamps: true })
export class TrainingModule extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: ModuleType })
  type: ModuleType;

  @Prop({ required: true, enum: DifficultyLevel })
  difficulty: DifficultyLevel;

  @Prop({ type: [{ type: String }], required: true })
  languages: string[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Resource' }] })
  resources: string[];

  @Prop({ type: Number, required: true })
  durationMinutes: number;

  @Prop({ type: Number, required: true })
  pointsAwarded: number;

  @Prop({ type: [String] })
  requiredSkills: string[];

  @Prop({ type: [String] })
  skillsLearned: string[];
}

export const TrainingModuleSchema = SchemaFactory.createForClass(TrainingModule);