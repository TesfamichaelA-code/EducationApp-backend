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
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { envValidationSchema } from './config/env.validation';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { NotesModule } from './notes/notes.module';
import { ResourcesModule } from './resources/resources.module';
import { UsersModule } from './users/users.module';

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
    // Mongoose connection — uses MONGO_URL + DB_NAME from env.
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGO_URL'),
        dbName: config.getOrThrow<string>('DB_NAME'),
      }),
    }),
    UsersModule,
    AuthModule,
    CoursesModule,
    EnrollmentsModule,
    FlashcardsModule,
    NotesModule,
    ResourcesModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    // Order matters: ThrottlerGuard first (rate-limit before doing auth work),
    // then JwtAuthGuard globally (opt-out per route via @Public()).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
