/**
 * RefreshToken schema.
 *
 * Each issued refresh token is stored as a SHA-256 hex digest so a DB leak
 * does not give an attacker usable session tokens (they have the *hash*,
 * not the JWT). SHA-256 is deterministic, fast, and has no length cap —
 * unlike bcrypt, which truncates anything beyond 72 bytes and would treat
 * all our JWTs as identical.
 *
 * On `/auth/refresh`, the incoming token is SHA-256'd, looked up by exact
 * match, and revoked. The (userId, tokenHash) compound index makes lookup O(1).
 *
 * The `expiresAt` TTL index lets MongoDB auto-purge expired rows so the
 * collection cannot grow unbounded.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { baseSchemaOptions } from '../../common/database/base-schema';

@Schema(baseSchemaOptions)
export class RefreshToken {
  @Prop({ required: true, index: true })
  userId!: string;

  /** SHA-256 hex digest of the refresh JWT. Never returned by default. */
  @Prop({ required: true, select: false })
  tokenHash!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: false })
  revoked!: boolean;
}

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;
export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// TTL index — MongoDB drops the row once `expiresAt` is in the past.
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Compound index for O(1) rotation lookup.
RefreshTokenSchema.index({ userId: 1, tokenHash: 1 });
