import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Flashcard } from './schemas/flashcard.schema';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class FlashcardsService {
  constructor(
    @InjectModel(Flashcard.name) private flashcardModel: Model<Flashcard>,
  ) {}

  async create(createFlashcardDto: CreateFlashcardDto, userId: string): Promise<Flashcard> {
    const createdFlashcard = new this.flashcardModel({
      ...createFlashcardDto,
      creator: userId,
    });
    return createdFlashcard.save();
  }

  async findAll(user: any): Promise<Flashcard[]> {
    const query: any = {};
    
    if (user.role === UserRole.TEACHER) {
      query.creator = user._id;
    }
    
    return this.flashcardModel
      .find(query)
      .populate('creator', 'name email')
      .populate('course', 'title')
      .exec();
  }

  async findByCourse(courseId: string): Promise<Flashcard[]> {
    return this.flashcardModel
      .find({ course: courseId })
      .populate('creator', 'name email')
      .populate('course', 'title')
      .exec();
  }

  async findOne(id: string): Promise<Flashcard> {
    const flashcard = await this.flashcardModel
      .findById(id)
      .populate('creator', 'name email')
      .populate('course', 'title')
      .exec();

    if (!flashcard) {
      throw new NotFoundException('Flashcard not found');
    }

    return flashcard;
  }

  async update(id: string, updateFlashcardDto: any, user: any): Promise<Flashcard> {
    const flashcard = await this.flashcardModel.findById(id);
    
    if (!flashcard) {
      throw new NotFoundException('Flashcard not found');
    }

    if (flashcard.creator.toString() !== user._id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    return this.flashcardModel
      .findByIdAndUpdate(id, updateFlashcardDto, { new: true })
      .exec();
  }

  async remove(id: string, user: any): Promise<void> {
    const flashcard = await this.flashcardModel.findById(id);
    
    if (!flashcard) {
      throw new NotFoundException('Flashcard not found');
    }

    if (flashcard.creator.toString() !== user._id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    await this.flashcardModel.findByIdAndDelete(id).exec();
  }
}