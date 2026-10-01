/**
 * AiUsage — one row per (user, UTC day) counting AI calls, used to enforce a
 * per-user daily quota so a single account cannot run up the LLM bill.
 *
 * Rows expire automatically two days after creation.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { baseSchemaOptions } from '../../common/database/base-schema';

@Schema(baseSchemaOptions)
export class AiUsage {
  @Prop({ required: true })
  userId!: string;

  /** UTC calendar day, `YYYY-MM-DD`. */
  @Prop({ required: true })
  day!: string;

  @Prop({ default: 0 })
  count!: number;
}

export type AiUsageDocument = HydratedDocument<AiUsage>;
export const AiUsageSchema = SchemaFactory.createForClass(AiUsage);
AiUsageSchema.index({ userId: 1, day: 1 }, { unique: true });
AiUsageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2 * 86_400 });
