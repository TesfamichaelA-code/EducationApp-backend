/**
 * FlashcardsModule — bundles decks + cards + review state + the SM-2 study
 * loop. Other modules (AI feature endpoints, analytics) inject the services
 * exported from here.
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { DecksController } from './decks.controller';
import { DecksService } from './decks.service';
import { FlashcardsController } from './flashcards.controller';
import { FlashcardsService } from './flashcards.service';
import { Deck, DeckSchema } from './schemas/deck.schema';
import { Flashcard, FlashcardSchema } from './schemas/flashcard.schema';
import { ReviewState, ReviewStateSchema } from './schemas/review-state.schema';
import { StudyController } from './study.controller';
import { StudyService } from './study.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Deck.name, schema: DeckSchema },
      { name: Flashcard.name, schema: FlashcardSchema },
      { name: ReviewState.name, schema: ReviewStateSchema },
    ]),
    EnrollmentsModule,
  ],
  controllers: [DecksController, FlashcardsController, StudyController],
  providers: [DecksService, FlashcardsService, StudyService],
  exports: [DecksService, FlashcardsService, StudyService],
})
export class FlashcardsModule {}
