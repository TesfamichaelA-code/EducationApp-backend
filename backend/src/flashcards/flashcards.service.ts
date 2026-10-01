/**
 * FlashcardsService — card CRUD scoped to a deck, with bulk insert used by
 * the AI flashcard-generation pipeline.
 *
 * Ownership cascades: a card's owner is the deck's owner. We check the deck
 * once and trust subsequent operations on its cards.
 */

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UserRole } from '../users/schemas/user.schema';
import { DecksService } from './decks.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { Flashcard, FlashcardDocument } from './schemas/flashcard.schema';

@Injectable()
export class FlashcardsService {
  constructor(
    @InjectModel(Flashcard.name) private readonly model: Model<Flashcard>,
    private readonly decks: DecksService,
  ) {}

  async create(
    userId: string,
    role: UserRole,
    deckId: string,
    dto: CreateFlashcardDto,
  ): Promise<FlashcardDocument> {
    const deck = await this.decks.findOne(deckId);
    if (deck.ownerId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the deck owner can add cards');
    }
    return this.model.create({ deckId, ...dto });
  }

  /** Bulk insert — used by the AI flashcard-from-text pipeline. */
  async createMany(
    userId: string,
    role: UserRole,
    deckId: string,
    cards: Array<Pick<Flashcard, 'question' | 'answer'> & Partial<Pick<Flashcard, 'hint' | 'tags'>>>,
  ): Promise<FlashcardDocument[]> {
    const deck = await this.decks.findOne(deckId);
    if (deck.ownerId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the deck owner can add cards');
    }
    const docs = cards.map((c) => ({ deckId, ...c }));
    return this.model.insertMany(docs) as unknown as Promise<FlashcardDocument[]>;
  }

  /** Cards in a deck, after checking the caller may see that deck's course. */
  async listViewable(deckId: string, userId: string, role: UserRole): Promise<FlashcardDocument[]> {
    const deck = await this.decks.findViewable(deckId, userId, role);
    return this.listByDeck(deck.id);
  }

  async findViewable(id: string, userId: string, role: UserRole): Promise<FlashcardDocument> {
    const card = await this.findOne(id);
    await this.decks.findViewable(card.deckId, userId, role);
    return card;
  }

  listByDeck(deckId: string): Promise<FlashcardDocument[]> {
    return this.model.find({ deckId }).exec();
  }

  countByDeck(deckId: string): Promise<number> {
    return this.model.countDocuments({ deckId }).exec();
  }

  findManyByDecks(deckIds: string[]): Promise<FlashcardDocument[]> {
    return this.model.find({ deckId: { $in: deckIds } }).exec();
  }

  async findOne(id: string): Promise<FlashcardDocument> {
    const card = await this.model.findById(id).exec();
    if (!card) throw new NotFoundException('Flashcard not found');
    return card;
  }

  async update(
    id: string,
    userId: string,
    role: UserRole,
    dto: UpdateFlashcardDto,
  ): Promise<FlashcardDocument> {
    const card = await this.findOne(id);
    const deck = await this.decks.findOne(card.deckId);
    if (deck.ownerId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the deck owner can edit cards');
    }
    Object.assign(card, dto);
    return card.save();
  }

  async remove(id: string, userId: string, role: UserRole): Promise<void> {
    const card = await this.findOne(id);
    const deck = await this.decks.findOne(card.deckId);
    if (deck.ownerId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the deck owner can delete cards');
    }
    await card.deleteOne();
  }
}
