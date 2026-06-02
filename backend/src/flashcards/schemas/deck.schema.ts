/**
 * Deck — a named collection of flashcards inside a course.
 *
 * Decks let a teacher organize cards by topic ("Chapter 1: Cells",
 * "Chapter 2: DNA") without cluttering the course-level UI. A course can
 * have many decks; a card belongs to exactly one deck.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { baseSchemaOptions } from '../../common/database/base-schema';

@Schema(baseSchemaOptions)
export class Deck {
  @Prop({ required: true, index: true })
  courseId!: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  name!: string;

  @Prop({ default: '', maxlength: 500 })
  description!: string;

  /** Teacher who created the deck (User._id). */
  @Prop({ required: true, index: true })
  ownerId!: string;
}

export type DeckDocument = HydratedDocument<Deck>;
export const DeckSchema = SchemaFactory.createForClass(Deck);
