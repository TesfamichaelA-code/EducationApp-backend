/**
 * Joi schema for environment variables.
 *
 * Variables required *right now* are marked .required(); others are .optional()
 * and will be promoted to .required() when their owning module ships
 * (e.g. JWT_ACCESS_SECRET in Block B, MONGO_URL when persistence comes online).
 *
 * Validation runs at process start — if a required var is missing, Nest fails
 * fast instead of booting into a half-broken state.
 */

import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // ── Runtime ────────────────────────────────────────────────────────────────
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(8001),

  // ── CORS ───────────────────────────────────────────────────────────────────
  // Required in production: an unset value means "allow every origin", which
  // combined with credentialed CORS would let any site act as the user.
  FRONTEND_ORIGIN: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').optional(),
  }),

  // ── API docs ───────────────────────────────────────────────────────────────
  // Swagger UI is on by default outside production, off in production.
  ENABLE_SWAGGER: Joi.boolean().optional(),

  // ── AI (Gemini) ────────────────────────────────────────────────────────────
  // API key is optional at boot so devs can run the API without AI configured;
  // AI endpoints return 503 until a key is set.
  GEMINI_API_KEY: Joi.string().allow('').optional(),
  GEMINI_MODEL: Joi.string().default('gemini-2.5-flash'),
  // Per-user cap on AI requests per UTC day (admins are exempt).
  AI_DAILY_LIMIT: Joi.number().integer().min(1).default(50),

  // ── Database ───────────────────────────────────────────────────────────────
  MONGO_URL: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // ── Auth ───────────────────────────────────────────────────────────────────
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL: Joi.string().default('7d'),

  // ── Admin seed ─────────────────────────────────────────────────────────────
  // If unset, the seed step is skipped silently — useful for ephemeral tests.
  ADMIN_EMAIL: Joi.string().email().optional(),
  ADMIN_PASSWORD: Joi.string().min(8).optional(),
  ADMIN_NAME: Joi.string().optional(),
});
