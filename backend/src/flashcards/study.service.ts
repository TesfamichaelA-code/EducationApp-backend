/**
 * StudyService — the SM-2 review loop.
 *
 *   GET  /api/study/next-cards    Find what to study next
 *   POST /api/study/review        Record a single review and advance the schedule
 *   GET  /api/study/stats         Quick aggregate for the student dashboard
 *
 * "Next cards" returns two buckets:
 *   • dueNow   — cards the user has seen before whose review date is past
 *   • newCards — cards the user has never seen (no ReviewState yet)
 *
 * The default mix is "due first, then new" because cramming new content while
 * old material rots is the #1 anti-pattern Anki tries to prevent.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { EnrollmentsService } from '../enrollments/enrollments.service';
import { DecksService } from './decks.service';
import { FlashcardsService } from './flashcards.service';
import { Flashcard, FlashcardDocument } from './schemas/flashcard.schema';
import { ReviewState, ReviewStateDocument } from './schemas/review-state.schema';
import { sm2 } from './sm2';

export interface NextCardsResult {
  dueNow: Array<{ card: FlashcardDocument; state: ReviewStateDocument }>;
  newCards: FlashcardDocument[];
}

@Injectable()
export class StudyService {
  constructor(
    @InjectModel(ReviewState.name) private readonly stateModel: Model<ReviewState>,
    @InjectModel(Flashcard.name) private readonly cardModel: Model<Flashcard>,
    private readonly decks: DecksService,
    private readonly flashcards: FlashcardsService,
    private readonly enrollments: EnrollmentsService,
  ) {}

  /**
   * What should the user study next?
   *
   * Source set is bounded by either:
   *   • a specific `deckId` (when the user picks a deck in the UI), or
   *   • all decks across every course the user is currently enrolled in.
   *
   * Teachers and admins also see their own decks via the deckId path —
   * authorization for course content is enforced at the deck/card layer.
   */
  async nextCards(
    userId: string,
    opts: { deckId?: string; limit?: number } = {},
  ): Promise<NextCardsResult> {
    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);

    let cards: FlashcardDocument[];
    if (opts.deckId) {
      cards = await this.flashcards.listByDeck(opts.deckId);
    } else {
      const enrolledCourses = await this.enrollments.listForStudent(userId);
      if (enrolledCourses.length === 0) return { dueNow: [], newCards: [] };
      const decks = await this.decks.listByCourses(enrolledCourses.map((c) => c.id));
      if (decks.length === 0) return { dueNow: [], newCards: [] };
      cards = await this.flashcards.findManyByDecks(decks.map((d) => d.id));
    }
    if (cards.length === 0) return { dueNow: [], newCards: [] };

    const cardIds = cards.map((c) => c.id);
    const states = await this.stateModel.find({ userId, flashcardId: { $in: cardIds } }).exec();
    const stateMap = new Map(states.map((s) => [s.flashcardId, s]));

    const now = new Date();
    const dueNow: NextCardsResult['dueNow'] = [];
    const newCards: FlashcardDocument[] = [];

    for (const card of cards) {
      const st = stateMap.get(card.id);
      if (!st) {
        if (newCards.length < limit) newCards.push(card);
      } else if (st.dueAt.getTime() <= now.getTime()) {
        if (dueNow.length < limit) dueNow.push({ card, state: st });
      }
      if (dueNow.length >= limit && newCards.length >= limit) break;
    }

    return { dueNow, newCards };
  }

  /**
   * Record a single review and advance the SM-2 schedule.
   *
   * The ReviewState row is created on first review (upsert semantics
   * implemented via "find or new"). Returning the updated state lets the
   * frontend show the next due date immediately.
   */
  async review(userId: string, flashcardId: string, quality: number): Promise<ReviewStateDocument> {
    const card = await this.cardModel.findById(flashcardId).exec();
    if (!card) throw new NotFoundException('Flashcard not found');

    let state = await this.stateModel.findOne({ userId, flashcardId }).exec();
    if (!state) {
      state = new this.stateModel({ userId, flashcardId });
    }

    const next = sm2(
      {
        easeFactor: state.easeFactor,
        interval: state.interval,
        repetitions: state.repetitions,
      },
      quality,
    );
    state.easeFactor = next.easeFactor;
    state.interval = next.interval;
    state.repetitions = next.repetitions;
    state.dueAt = next.dueAt;
    state.lastReviewedAt = new Date();
    await state.save();
    return state;
  }

  async stats(userId: string): Promise<{
    totalReviewed: number;
    dueNow: number;
    learning: number;
    mature: number;
  }> {
    const now = new Date();
    const [totalReviewed, dueNow, mature, learning] = await Promise.all([
      this.stateModel.countDocuments({ userId }).exec(),
      this.stateModel.countDocuments({ userId, dueAt: { $lte: now } }).exec(),
      // "mature" = an Anki convention: interval ≥ 21 days
      this.stateModel.countDocuments({ userId, interval: { $gte: 21 } }).exec(),
      this.stateModel.countDocuments({ userId, interval: { $lt: 21, $gt: 0 } }).exec(),
    ]);
    return { totalReviewed, dueNow, learning, mature };
  }
}
