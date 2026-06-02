/**
 * AuthController — public auth surface.
 *
 *   POST /api/auth/register     @Public   201 + Set-Cookie
 *   POST /api/auth/login        @Public   200 + Set-Cookie  (5 req/min throttle)
 *   POST /api/auth/refresh      @Public   200 + new cookies (rotation)
 *   POST /api/auth/logout                 204
 *   POST /api/auth/logout-all             204  (revoke every session)
 *   GET  /api/auth/me                     200 (sanitized user)
 *
 * Tokens are returned BOTH as httpOnly cookies (browser SPA) AND in the JSON
 * body (mobile / API clients). Pick whichever transport fits the consumer.
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { AuthService, IssuedTokens } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1_000;
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1_000;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new account (defaults to STUDENT role)' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.register(dto);
    this.setAuthCookies(res, tokens);
    return this.toBody(tokens);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 5 } }) // 5 attempts/min/IP at the edge
  @ApiOperation({ summary: 'Login with email + password' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // X-Forwarded-For respected because Express trust proxy is set in main.ts
    const ip = req.ip ?? 'unknown';
    const tokens = await this.auth.login(dto, ip);
    this.setAuthCookies(res, tokens);
    return this.toBody(tokens);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate access + refresh tokens' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieToken = (req.cookies as Record<string, string> | undefined)?.refresh_token;
    const bodyToken = (req.body as { refreshToken?: string } | undefined)?.refreshToken;
    const token = cookieToken ?? bodyToken;
    if (!token) throw new UnauthorizedException('No refresh token provided');
    const tokens = await this.auth.refresh(token);
    this.setAuthCookies(res, tokens);
    return this.toBody(tokens);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current session' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req.cookies as Record<string, string> | undefined)?.refresh_token;
    await this.auth.logout(token);
    this.clearAuthCookies(res);
  }

  @Post('logout-all')
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke every session for the current user' })
  async logoutAll(@CurrentUser() user: UserDocument, @Res({ passthrough: true }) res: Response) {
    await this.auth.logoutAll(user.id);
    this.clearAuthCookies(res);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current authenticated user' })
  me(@CurrentUser() user: UserDocument) {
    return user.toJSON();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private toBody(tokens: IssuedTokens) {
    return {
      user: tokens.user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private cookieOptions(): CookieOptions {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    };
  }

  private setAuthCookies(res: Response, tokens: IssuedTokens): void {
    const base = this.cookieOptions();
    res.cookie('access_token', tokens.accessToken, { ...base, maxAge: ACCESS_COOKIE_MAX_AGE });
    res.cookie('refresh_token', tokens.refreshToken, { ...base, maxAge: REFRESH_COOKIE_MAX_AGE });
  }

  private clearAuthCookies(res: Response): void {
    const base = this.cookieOptions();
    res.clearCookie('access_token', base);
    res.clearCookie('refresh_token', base);
  }
}
