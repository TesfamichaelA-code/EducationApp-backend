/**
 * ReviewState — per-(user, flashcard) SM-2 spaced-repetition state.
 *
 * Indexes:
 *   • (userId, flashcardId) unique — exactly one state per user per card
 *   • (userId, dueAt)               — the hot query: "what's due for me now?"
 *
 * Starting values (per the SM-2 paper):
 *   easeFactor = 2.5
 *   interval   = 0   (will become 1 day on first successful review)
 *   repetitions= 0
 *   dueAt      = now (a brand-new card is immediately "due")
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { baseSchemaOptions } from '../../common/database/base-schema';

@Schema(baseSchemaOptions)
export class ReviewState {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true, index: true })
  flashcardId!: string;

  @Prop({ default: 2.5 })
  easeFactor!: number;

  /** Days until next review. */
  @Prop({ default: 0 })
  interval!: number;

  /** Number of consecutive successful reviews (resets on lapse). */
  @Prop({ default: 0 })
  repetitions!: number;

  @Prop({ required: true, default: () => new Date() })
  dueAt!: Date;

  @Prop()
  lastReviewedAt?: Date;
}

export type ReviewStateDocument = HydratedDocument<ReviewState>;
export const ReviewStateSchema = SchemaFactory.createForClass(ReviewState);
ReviewStateSchema.index({ userId: 1, flashcardId: 1 }, { unique: true });
ReviewStateSchema.index({ userId: 1, dueAt: 1 });
