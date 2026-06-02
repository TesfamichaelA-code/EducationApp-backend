/**
 * Flashcard — a single question/answer pair inside a deck.
 *
 * SM-2 review state lives in a separate {@link ReviewState} collection so a
 * single card can have independent state per student. Embedding state on
 * the card would force a large array proportional to enrollment size.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { baseSchemaOptions } from '../../common/database/base-schema';

@Schema(baseSchemaOptions)
export class Flashcard {
  @Prop({ required: true, index: true })
  deckId!: string;

  @Prop({ required: true, trim: true, maxlength: 1_000 })
  question!: string;

  @Prop({ required: true, trim: true, maxlength: 2_000 })
  answer!: string;

  @Prop({ default: '', maxlength: 500 })
  hint!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];
}

export type FlashcardDocument = HydratedDocument<Flashcard>;
export const FlashcardSchema = SchemaFactory.createForClass(Flashcard);
