import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Note } from './schemas/note.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Note.name) private noteModel: Model<Note>,
  ) {}

  async create(createNoteDto: CreateNoteDto, userId: string): Promise<Note> {
    const createdNote = new this.noteModel({
      ...createNoteDto,
      user: userId,
    });
    return createdNote.save();
  }

  async findAll(user: any): Promise<Note[]> {
    const query: any = {};
    
    if (user.role !== UserRole.ADMIN) {
      query.$or = [
        { user: user._id },
        { isPrivate: false }
      ];
    }
    
    return this.noteModel
      .find(query)
      .populate('user', 'name email')
      .populate('course', 'title')
      .populate('resource', 'title')
      .exec();
  }

  async findOne(id: string, user: any): Promise<Note> {
    const note = await this.noteModel
      .findById(id)
      .populate('user', 'name email')
      .populate('course', 'title')
      .populate('resource', 'title')
      .exec();

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.isPrivate && note.user.toString() !== user._id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    return note;
  }

  async update(id: string, updateNoteDto: UpdateNoteDto, user: any): Promise<Note> {
    const note = await this.noteModel.findById(id);
    
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.user.toString() !== user._id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    return this.noteModel
      .findByIdAndUpdate(id, updateNoteDto, { new: true })
      .exec();
  }

  async remove(id: string, user: any): Promise<void> {
    const note = await this.noteModel.findById(id);
    
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.user.toString() !== user._id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    await this.noteModel.findByIdAndDelete(id).exec();
  }
}