import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Skill, SkillDocument } from './schemas/skill.schema';

@Injectable()
export class SkillsService {
  constructor(
    @InjectModel(Skill.name) private skillModel: Model<SkillDocument>,
  ) {}

  async create(skill: Skill): Promise<Skill> {
    const createdSkill = new this.skillModel(skill);
    return createdSkill.save();
  }

  async findAll(): Promise<Skill[]> {
    return this.skillModel.find().exec();
  }

  async findOne(id: string): Promise<Skill> {
    return this.skillModel.findById(id).exec();
  }

  async update(id: string, skill: Skill): Promise<Skill> {
    return this.skillModel.findByIdAndUpdate(id, skill, { new: true }).exec();
  }

  async remove(id: string): Promise<Skill> {
    return this.skillModel.findByIdAndDelete(id).exec();
  }
} 