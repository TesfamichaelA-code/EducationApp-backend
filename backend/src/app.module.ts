/**
 * Root module.
 *
 * Currently wires:
 *   • ConfigModule (global) with Joi schema validation
 *   • LoggerModule (Pino) with redaction of sensitive headers
 *   • ThrottlerModule with a sane default of 60 req/min per IP
 *   • AiModule (Gemini adapter + smoke-test endpoints)
 *
 * Auth, Users, Courses, Flashcards, Notes, Resources, Progress, Analytics,
 * Meetings — all added in subsequent execution blocks.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AiModule } from './ai/ai.module';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false, allowUnknown: true },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        // Pretty logs in development, JSON in production (for log shippers).
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
            : undefined,
        autoLogging: true,
        // Never log auth tokens or cookies — even by accident.
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
          censor: '[REDACTED]',
        },
      },
    }),
    // 60 requests per minute per IP — generous default, tightened per-route later.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    // Apply throttling globally; individual routes can override with @SkipThrottle / @Throttle.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
