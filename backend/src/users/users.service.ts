/**
 * UsersService — single source of truth for all User reads/writes.
 *
 * Auth-specific operations (registration flow, login flow) live in AuthService
 * which delegates here. Keep this file storage-focused; business rules live
 * in the modules that consume it.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument, UserRole } from './schemas/user.schema';

export interface CreateUserInput {
  email: string;
  name: string;
  passwordHash: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly model: Model<User>) {}

  /** Returns the new user with a populated hash so AuthService can issue tokens. */
  async create(input: CreateUserInput): Promise<UserDocument> {
    return this.model.create({
      email: input.email.toLowerCase().trim(),
      name: input.name.trim(),
      passwordHash: input.passwordHash,
      role: input.role ?? UserRole.STUDENT,
    });
  }

  /** Public lookup — no hash. */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.model.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  /** Auth-only lookup — pulls the hash for bcrypt.compare(). */
  async findByEmailWithHash(email: string): Promise<UserDocument | null> {
    return this.model
      .findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash')
      .exec();
  }

  /** Returns the user (without hash) or null. Used by JwtStrategy. */
  async findByIdSafe(id: string): Promise<UserDocument | null> {
    return this.model.findById(id).exec();
  }

  /** Same as above but throws when missing — for controllers. */
  async findByIdOrFail(id: string): Promise<UserDocument> {
    const user = await this.model.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.model.updateOne({ _id: id }, { lastLoginAt: new Date() }).exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  async setRole(id: string, role: UserRole): Promise<UserDocument> {
    const user = await this.model.findByIdAndUpdate(id, { role }, { new: true }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setActive(id: string, isActive: boolean): Promise<UserDocument> {
    const user = await this.model.findByIdAndUpdate(id, { isActive }, { new: true }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
