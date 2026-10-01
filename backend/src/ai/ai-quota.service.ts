/**
 * AiQuotaService — per-user daily cap on AI calls (AI_DAILY_LIMIT, default 50).
 *
 * `consume` is a single atomic upsert: it only matches while count < limit,
 * so once the cap is reached the upsert tries to insert a duplicate
 * (userId, day) row, hits the unique index, and we answer 429. No race window
 * between "check" and "increment". Admins are exempt.
 */

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UserRole } from '../users/schemas/user.schema';
import { AiUsage } from './schemas/ai-usage.schema';

const DUPLICATE_KEY = 11000;

@Injectable()
export class AiQuotaService {
  private readonly limit: number;

  constructor(
    @InjectModel(AiUsage.name) private readonly model: Model<AiUsage>,
    config: ConfigService,
  ) {
    this.limit = Number(config.get<number>('AI_DAILY_LIMIT') ?? 50);
  }

  async consume(userId: string, role: UserRole): Promise<void> {
    if (role === UserRole.ADMIN) return;
    const day = new Date().toISOString().slice(0, 10);
    try {
      await this.model
        .findOneAndUpdate(
          { userId, day, count: { $lt: this.limit } },
          { $inc: { count: 1 } },
          { upsert: true },
        )
        .exec();
    } catch (err) {
      if ((err as { code?: number }).code === DUPLICATE_KEY) {
        throw new HttpException(
          `Daily AI limit reached (${this.limit} requests). It resets at 00:00 UTC.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw err;
    }
  }
}
