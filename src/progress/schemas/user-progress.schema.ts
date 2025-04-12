import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class UserProgress extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TrainingModule', required: true })
  module: string;

  @Prop({ type: Number, default: 0 })
  completionPercentage: number;

  @Prop({ type: Number, default: 0 })
  score: number;

  @Prop({ type: Date })
  startedAt: Date;

  @Prop({ type: Date })
  completedAt: Date;

  @Prop({ type: Boolean, default: false })
  isCompleted: boolean;

  @Prop({ type: Number, default: 0 })
  pointsEarned: number;

  @Prop({ type: [String], default: [] })
  achievementsUnlocked: string[];
}

export const UserProgressSchema = SchemaFactory.createForClass(UserProgress);