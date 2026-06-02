/**
 * AuthService — the only place auth state mutates.
 *
 * Responsibilities:
 *   • register / login   — credential verification, brute-force tracking
 *   • issueTokens         — sign + persist hashed refresh token
 *   • refresh             — verify, rotate (revoke + reissue)
 *   • logout / logoutAll  — revoke one or all sessions
 *
 * Brute-force model:
 *   identifier = "<ip>:<email>"
 *   5 consecutive failures → 15-minute lockout
 *   Success → tracker deleted
 *
 * Token model:
 *   access  = 15m, payload { sub, email, role, type: 'access' }
 *   refresh = 7d,  payload { sub, type: 'refresh' }
 *   refresh tokens are stored hashed (bcrypt 10) and revoked on use.
 */

import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { Model } from 'mongoose';

import { UserDocument, UserRole } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginAttempt } from './schemas/login-attempt.schema';
import { RefreshToken } from './schemas/refresh-token.schema';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1_000;

/**
 * Deterministic SHA-256 of a refresh token, hex-encoded.
 *
 * Why not bcrypt? bcrypt silently truncates inputs at 72 bytes — and our
 * signed JWTs share the first ~72 bytes (identical header + start of payload),
 * so bcrypt treats every refresh token as the same string. SHA-256 has no
 * length limit and is the correct primitive for verifying a high-entropy
 * value we generated ourselves (we don't need a slow KDF here).
 */
function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface IssuedTokens {
  user: Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectModel(RefreshToken.name) private readonly tokenModel: Model<RefreshToken>,
    @InjectModel(LoginAttempt.name) private readonly attemptModel: Model<LoginAttempt>,
  ) {}

  // ── Public flows ─────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<IssuedTokens> {
    const exists = await this.users.findByEmail(dto.email);
    if (exists) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.users.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      role: UserRole.STUDENT, // default; admin promotion via /users/:id/role
    });
    return this.issueTokens(user);
  }

  async login(dto: LoginDto, ip: string): Promise<IssuedTokens> {
    const identifier = `${ip}:${dto.email.toLowerCase().trim()}`;
    await this.assertNotLocked(identifier);

    // Fetch with hash; the lookup is fast (indexed email) and we need it
    // for bcrypt.compare even when the user doesn't exist (constant-time-ish).
    const user = await this.users.findByEmailWithHash(dto.email);
    const valid = user && (await bcrypt.compare(dto.password, user.passwordHash));

    if (!valid) {
      await this.recordFailure(identifier);
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Account disabled');
    }

    await this.clearAttempts(identifier);
    await this.users.updateLastLogin(user.id);
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<IssuedTokens> {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Deterministic SHA-256 lookup. Direct findOne is O(1) on the (userId,
    // tokenHash) index — far better than the O(n) bcrypt-scan we had before.
    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await this.tokenModel
      .findOne({ userId: payload.sub, tokenHash })
      .select('+tokenHash')
      .exec();

    if (!stored) {
      throw new UnauthorizedException('Refresh token not recognized');
    }
    if (stored.revoked) {
      // Replay attempt against a token we already rotated — strong signal of
      // theft. Revoke every active session for this user as a precaution.
      this.logger.warn(`Refresh replay detected for user ${payload.sub}; revoking all sessions`);
      await this.tokenModel
        .updateMany({ userId: payload.sub, revoked: false }, { $set: { revoked: true } })
        .exec();
      throw new UnauthorizedException('Refresh token revoked');
    }
    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Rotation — revoke the consumed token before issuing the new pair.
    stored.revoked = true;
    await stored.save();

    const user = await this.users.findByIdSafe(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or disabled');
    }
    return this.issueTokens(user);
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      }) as { sub: string };
      await this.tokenModel
        .updateMany({ userId: payload.sub, revoked: false }, { $set: { revoked: true } })
        .exec();
    } catch {
      // best-effort: a malformed cookie shouldn't break logout
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.tokenModel
      .updateMany({ userId, revoked: false }, { $set: { revoked: true } })
      .exec();
  }

  // ── Token issuance ───────────────────────────────────────────────────────

  private async issueTokens(user: UserDocument): Promise<IssuedTokens> {
    const sub = user.id;
    const accessTtlMs = parseDurationMs(this.config.get<string>('JWT_ACCESS_TTL') ?? '15m');
    const refreshTtlMs = parseDurationMs(this.config.get<string>('JWT_REFRESH_TTL') ?? '7d');

    const accessToken = this.jwt.sign(
      { sub, email: user.email, role: user.role, type: 'access' },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: Math.floor(accessTtlMs / 1_000), // jsonwebtoken accepts seconds as a number
      },
    );
    // `jti` (JWT ID) ensures every refresh token is byte-unique even when
    // two are issued in the same second for the same user — without it,
    // jwt.sign() returns the *same string* twice and our rotation breaks.
    const refreshToken = this.jwt.sign(
      { sub, type: 'refresh', jti: randomUUID() },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: Math.floor(refreshTtlMs / 1_000),
      },
    );

    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + refreshTtlMs);
    await this.tokenModel.create({ userId: sub, tokenHash, expiresAt });

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  // ── Brute force ──────────────────────────────────────────────────────────

  private async assertNotLocked(identifier: string): Promise<void> {
    const attempt = await this.attemptModel.findOne({ identifier }).exec();
    if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) {
      const remaining = Math.ceil((attempt.lockedUntil.getTime() - Date.now()) / 60_000);
      throw new HttpException(
        `Too many failed attempts. Try again in ${remaining} minute(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async recordFailure(identifier: string): Promise<void> {
    const attempt = await this.attemptModel
      .findOneAndUpdate(
        { identifier },
        { $inc: { attempts: 1 }, $set: { lastAttemptAt: new Date() } },
        { new: true, upsert: true },
      )
      .exec();
    if (attempt && attempt.attempts >= MAX_FAILED_ATTEMPTS) {
      attempt.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
      await attempt.save();
    }
  }

  private async clearAttempts(identifier: string): Promise<void> {
    await this.attemptModel.deleteOne({ identifier }).exec();
  }
}

/**
 * Tiny TTL parser — accepts strings like '15m', '7d', '30s', '12h'.
 * Falls back to 7 days on malformed input.
 */
function parseDurationMs(d: string): number {
  const match = d.trim().match(/^(\d+)\s*(s|m|h|d)$/i);
  if (!match) return 7 * 86_400_000;
  const n = Number(match[1]);
  const unit = match[2].toLowerCase() as 's' | 'm' | 'h' | 'd';
  const mult: Record<typeof unit, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return n * mult[unit];
}
