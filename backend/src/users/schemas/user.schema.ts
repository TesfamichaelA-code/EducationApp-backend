/**
 * User schema.
 *
 *  • email is unique, lowercased, indexed
 *  • passwordHash is `select: false` — never returned unless explicitly asked
 *  • role enum drives the RolesGuard
 *  • isActive is a soft-disable flag (admin can revoke without deletion)
 *  • lastLoginAt is updated on every successful login (for analytics)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { baseSchemaOptions } from '../../common/database/base-schema';

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

@Schema(baseSchemaOptions)
export class User {
  @Prop({ required: true, lowercase: true, trim: true, unique: true, index: true })
  email!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  /** bcrypt hash (rounds: 12). Never returned via toJSON; query with .select('+passwordHash'). */
  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.STUDENT })
  role!: UserRole;

  @Prop({ default: '' })
  avatarUrl!: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  lastLoginAt?: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
