/**
 * SeedService — idempotent admin bootstrap.
 *
 * On every boot:
 *   • if no user exists for ADMIN_EMAIL → create one with role=ADMIN
 *   • if a user exists but their stored bcrypt hash no longer matches
 *     ADMIN_PASSWORD (i.e. the env was rotated) → re-hash and update
 *   • if the existing user isn't role=ADMIN → promote them
 *
 * Skipped silently if ADMIN_EMAIL or ADMIN_PASSWORD is unset.
 */

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UserRole } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    const name = this.config.get<string>('ADMIN_NAME') ?? 'Platform Admin';

    if (!email || !password) {
      this.logger.warn('Admin seed skipped: ADMIN_EMAIL or ADMIN_PASSWORD not set');
      return;
    }

    const existing = await this.users.findByEmailWithHash(email);

    if (!existing) {
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await this.users.create({ email, name, passwordHash, role: UserRole.ADMIN });
      this.logger.log(`✔ Admin seeded: ${email}`);
      return;
    }

    const passwordMatches = await bcrypt.compare(password, existing.passwordHash);
    if (!passwordMatches) {
      existing.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      this.logger.log(`✔ Admin password updated from env: ${email}`);
    }
    if (existing.role !== UserRole.ADMIN) {
      existing.role = UserRole.ADMIN;
      this.logger.log(`✔ Admin role promoted: ${email}`);
    }
    if (existing.isModified()) {
      await existing.save();
    } else {
      this.logger.log(`• Admin already current: ${email}`);
    }
  }
}
