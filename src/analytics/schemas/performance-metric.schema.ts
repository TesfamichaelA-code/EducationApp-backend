import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class PerformanceMetric extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: string;

  @Prop({ type: Number, required: true })
  completionRate: number;

  @Prop({ type: Number, required: true })
  averageScore: number;

  @Prop({ type: Number, required: true })
  learningSpeed: number;

  @Prop({ type: Number, required: true })
  engagementLevel: number;

  @Prop({ type: [String] })
  strengthAreas: string[];

  @Prop({ type: [String] })
  improvementAreas: string[];

  @Prop({ type: Map, of: Number })
  skillLevels: Map<string, number>;

  @Prop({ type: Date })
  periodStart: Date;

  @Prop({ type: Date })
  periodEnd: Date;
}

export const PerformanceMetricSchema = SchemaFactory.createForClass(PerformanceMetric);