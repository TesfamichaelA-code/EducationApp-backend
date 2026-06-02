/**
 * DecksService — CRUD + ownership enforcement for decks.
 *
 * Ownership: the teacher who created the deck (or any admin) may update or
 * delete it. Anyone authed may read the listing — gating *card content*
 * access happens further down the stack (FlashcardsService).
 */

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UserRole } from '../users/schemas/user.schema';
import { CreateDeckDto } from './dto/create-deck.dto';
import { Deck, DeckDocument } from './schemas/deck.schema';

@Injectable()
export class DecksService {
  constructor(@InjectModel(Deck.name) private readonly model: Model<Deck>) {}

  create(ownerId: string, courseId: string, dto: CreateDeckDto): Promise<DeckDocument> {
    return this.model.create({ ownerId, courseId, ...dto });
  }

  listByCourse(courseId: string): Promise<DeckDocument[]> {
    return this.model.find({ courseId }).sort({ createdAt: -1 }).exec();
  }

  listByCourses(courseIds: string[]): Promise<DeckDocument[]> {
    return this.model.find({ courseId: { $in: courseIds } }).exec();
  }

  async findOne(id: string): Promise<DeckDocument> {
    const deck = await this.model.findById(id).exec();
    if (!deck) throw new NotFoundException('Deck not found');
    return deck;
  }

  async update(
    id: string,
    userId: string,
    role: UserRole,
    dto: Partial<CreateDeckDto>,
  ): Promise<DeckDocument> {
    const deck = await this.findOne(id);
    this.assertOwnership(deck, userId, role);
    Object.assign(deck, dto);
    return deck.save();
  }

  async remove(id: string, userId: string, role: UserRole): Promise<void> {
    const deck = await this.findOne(id);
    this.assertOwnership(deck, userId, role);
    await deck.deleteOne();
  }

  private assertOwnership(deck: DeckDocument, userId: string, role: UserRole): void {
    if (deck.ownerId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the deck owner (or admin) may do this');
    }
  }
}
