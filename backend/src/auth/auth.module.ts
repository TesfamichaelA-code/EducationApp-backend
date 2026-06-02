/**
 * AuthModule — wires JWT, Passport, the brute-force tracker, refresh-token
 * store, and the idempotent admin SeedService.
 *
 * Note: JwtModule.register({}) registers with no defaults — every sign/verify
 * call passes its own secret + expiry, so we can use distinct keys for the
 * access and refresh tokens (different lifetimes, different blast radius).
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginAttempt, LoginAttemptSchema } from './schemas/login-attempt.schema';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';
import { SeedService } from './seed.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: LoginAttempt.name, schema: LoginAttemptSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SeedService],
  exports: [AuthService],
})
export class AuthModule {}
