/**
 * DecksService — CRUD + ownership enforcement for decks.
 *
 * Authorization:
 *   • create        — course owner or admin
 *   • read / list   — course owner, enrolled student, or admin
 *   • update/delete — the deck's creator or admin
 *
 * `findViewable` is the gate every card-level read goes through, so card
 * content never leaks to users outside the course.
 */

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CourseAccessService } from '../enrollments/course-access.service';
import { UserRole } from '../users/schemas/user.schema';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';
import { Deck, DeckDocument } from './schemas/deck.schema';

@Injectable()
export class DecksService {
  constructor(
    @InjectModel(Deck.name) private readonly model: Model<Deck>,
    private readonly access: CourseAccessService,
  ) {}

  async create(
    ownerId: string,
    role: UserRole,
    courseId: string,
    dto: CreateDeckDto,
  ): Promise<DeckDocument> {
    const course = await this.access.assertCanManage(courseId, ownerId, role);
    return this.model.create({ ownerId, courseId: course.id, ...dto });
  }

  async listByCourse(courseId: string, userId: string, role: UserRole): Promise<DeckDocument[]> {
    const course = await this.access.assertCanView(courseId, userId, role);
    return this.model.find({ courseId: course.id }).sort({ createdAt: -1 }).exec();
  }

  listByCourses(courseIds: string[]): Promise<DeckDocument[]> {
    return this.model.find({ courseId: { $in: courseIds } }).exec();
  }

  async findOne(id: string): Promise<DeckDocument> {
    const deck = await this.model.findById(id).exec();
    if (!deck) throw new NotFoundException('Deck not found');
    return deck;
  }

  /** Deck lookup that also enforces course membership for the caller. */
  async findViewable(id: string, userId: string, role: UserRole): Promise<DeckDocument> {
    const deck = await this.findOne(id);
    await this.access.assertCanView(deck.courseId, userId, role);
    return deck;
  }

  async update(
    id: string,
    userId: string,
    role: UserRole,
    dto: UpdateDeckDto,
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
