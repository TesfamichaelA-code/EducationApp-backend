import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum ReportType {
  INDIVIDUAL = 'individual',
  DEPARTMENT = 'department',
  COURSE = 'course',
  COMPLIANCE = 'compliance',
}

@Schema({ timestamps: true })
export class Report extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, enum: ReportType })
  type: ReportType;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  data: any;

  @Prop({ type: Date, required: true })
  periodStart: Date;

  @Prop({ type: Date, required: true })
  periodEnd: Date;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  users: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course' })
  course?: string;

  @Prop({ type: String })
  department?: string;

  @Prop({ type: [String] })
  metrics: string[];

  @Prop({ type: Map, of: Number })
  kpis: Map<string, number>;
}

export const ReportSchema = SchemaFactory.createForClass(Report);