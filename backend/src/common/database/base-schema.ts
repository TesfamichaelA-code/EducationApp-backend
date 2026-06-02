/**
 * Shared Mongoose schema options used by every domain schema.
 *
 *  • `timestamps: true`                  — adds createdAt + updatedAt
 *  • `versionKey: false` (in toJSON)     — strips Mongoose's `__v`
 *  • `transform`                          — renames `_id` → `id` and strips
 *                                           secrets (passwordHash, tokenHash)
 *                                           from every JSON response so we
 *                                           cannot accidentally leak them.
 *
 * Apply with: `@Schema(baseSchemaOptions)` on the class.
 */

import type { SchemaOptions } from '@nestjs/mongoose';

export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = (ret._id as { toString(): string } | undefined)?.toString();
      delete ret._id;
      delete ret.passwordHash;
      delete ret.tokenHash;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    versionKey: false,
  },
};
