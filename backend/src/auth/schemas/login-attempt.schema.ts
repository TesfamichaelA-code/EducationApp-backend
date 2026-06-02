/**
 * LoginAttempt schema — per-(ip, email) brute-force tracker.
 *
 * Identifier format: "<ip>:<email>". 5 failed attempts in a row triggers
 * a 15-minute lockout (lockedUntil). On success, the row is deleted.
 *
 * The TTL on lastAttemptAt (24h) cleans up abandoned trackers automatically.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { baseSchemaOptions } from '../../common/database/base-schema';

@Schema(baseSchemaOptions)
export class LoginAttempt {
  @Prop({ required: true, unique: true, index: true })
  identifier!: string;

  @Prop({ default: 0 })
  attempts!: number;

  @Prop()
  lockedUntil?: Date;

  @Prop({ required: true, default: () => new Date() })
  lastAttemptAt!: Date;
}

export type LoginAttemptDocument = HydratedDocument<LoginAttempt>;
export const LoginAttemptSchema = SchemaFactory.createForClass(LoginAttempt);

// TTL: any tracker untouched for 24h is auto-deleted.
LoginAttemptSchema.index({ lastAttemptAt: 1 }, { expireAfterSeconds: 86_400 });
