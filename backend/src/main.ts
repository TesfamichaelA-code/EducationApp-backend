/**
 * LearnDeck API — application bootstrap.
 *
 * Responsibilities:
 *   • Construct the Nest application from {@link AppModule}.
 *   • Wire in cross-cutting concerns that must run before any request:
 *       - Pino structured logging (via nestjs-pino)
 *       - Helmet security headers
 *       - Strict CORS (origins driven by FRONTEND_ORIGIN)
 *       - Global `/api` prefix (matches the Kubernetes ingress contract)
 *       - Global ValidationPipe (whitelist + transform)
 *       - Global AllExceptionsFilter for consistent error envelopes
 *       - Swagger UI at `/api/docs`
 *   • Bind the HTTP server to 0.0.0.0:${PORT} (default 8001).
 *
 * Keep this file thin — feature wiring belongs in feature modules.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  // bufferLogs:true so early lifecycle logs are flushed through Pino, not the default logger.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);

  // ── Security headers ──────────────────────────────────────────────────────
  // crossOriginResourcePolicy must allow cross-origin for images/PDFs served
  // by the API to be embeddable in the Next.js frontend.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // ── Global API prefix ─────────────────────────────────────────────────────
  // Required by the platform ingress: any path under `/api/*` reaches the
  // backend; everything else is routed to the frontend (port 3000).
  app.setGlobalPrefix('api');

  // ── CORS ──────────────────────────────────────────────────────────────────
  // If FRONTEND_ORIGIN is unset (dev), allow all origins. In production, set
  // it to a comma-separated allow-list. `credentials: true` is required so
  // the browser sends our auth cookie / Authorization header.
  const rawOrigin = config.get<string>('FRONTEND_ORIGIN');
  const origins = rawOrigin ? rawOrigin.split(',').map((o) => o.trim()) : true;
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // ── Validation ────────────────────────────────────────────────────────────
  // whitelist+forbidNonWhitelisted strips unknown fields *and* rejects them
  // outright — catches accidental client payload drift early.
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Error envelope ────────────────────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Swagger ───────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LearnDeck API')
    .setDescription(
      'Education platform — courses, flashcards (SM-2 spaced repetition), notes, AI study assistance.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // ── Listen ────────────────────────────────────────────────────────────────
  const port = Number(config.get<string>('PORT') ?? 8001);
  await app.listen(port, '0.0.0.0');

  const log = app.get(Logger);
  log.log(`LearnDeck API listening on http://0.0.0.0:${port}/api`);
  log.log(`Swagger UI: http://0.0.0.0:${port}/api/docs`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
