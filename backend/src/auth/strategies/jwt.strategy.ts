/**
 * JwtStrategy — verifies the access token on every protected request and
 * attaches a sanitized User document to req.user.
 *
 * Extraction order: httpOnly cookie first, then `Authorization: Bearer`.
 * Cookies are the primary path for browser SPAs; the bearer header is used
 * by Postman, curl, and any non-browser client (mobile, CI).
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../../users/users.service';
import { UserDocument } from '../../users/schemas/user.schema';

interface AccessJwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

const cookieExtractor = (req: Request): string | null => {
  // express's cookie-parser populates req.cookies; null when middleware
  // isn't loaded or the cookie isn't present.
  return (req?.cookies as Record<string, string> | undefined)?.access_token ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: AccessJwtPayload): Promise<UserDocument> {
    // Defence-in-depth: refuse a refresh token if it ever lands on an
    // access-protected route. JWT signature already passed at this point.
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }
    const user = await this.users.findByIdSafe(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or disabled');
    }
    return user;
  }
}
