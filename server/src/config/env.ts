import 'dotenv/config';
import { z } from 'zod';

const bool = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true');

const schema = z.object({
  // ── Server ────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  APP_BASE_URL: z.string().url(),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  MAINTENANCE_MODE: bool,
  MAINTENANCE_BYPASS_TOKEN: z.string().min(16).optional(),

  // ── Firebase (Admin SDK service account) ──────────────────────────────
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_STORAGE_BUCKET: z.string().min(1),

  // ── Payments (Paystack) ───────────────────────────────────────────────
  PAYSTACK_SECRET_KEY: z.string().min(1),
  PAYSTACK_BASE_URL: z.string().url().default('https://api.paystack.co'),
  PAYMENT_CALLBACK_URL: z.string().url().optional(),
  SHIPPING_FLAT_FEE_NGN: z.coerce.number().int().min(0).default(0),

  // ── Email (inbox mirroring) ───────────────────────────────────────────
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: bool,
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('Aradam <no-reply@aradam.example>'),

  // ── Customer support chat ─────────────────────────────────────────────
  SUPPORT_AI_ENABLED: bool,
  ANTHROPIC_API_KEY: z.string().optional(),
  SUPPORT_AI_MODEL: z.string().default('claude-sonnet-5-5'),

  // ── Background jobs ───────────────────────────────────────────────────
  CRON_SECRET: z.string().min(16),
  ENABLE_INTERNAL_SCHEDULER: bool,
  JOB_INTERVAL_MINUTES: z.coerce.number().int().positive().default(15),
  STALE_ORDER_HOURS: z.coerce.number().int().positive().default(24),

  // ── Uploads ───────────────────────────────────────────────────────────
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(50),
});

// Treat `KEY=` (empty) in .env as "not set" so optional values behave.
const cleaned = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value !== undefined && value !== ''),
);

const parsed = schema.safeParse(cleaned);

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`);
  // eslint-disable-next-line no-console
  console.error(`\nInvalid environment configuration:\n${lines.join('\n')}\n`);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  IS_PRODUCTION: raw.NODE_ENV === 'production',
  FIREBASE_PRIVATE_KEY: raw.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  CORS_ORIGIN_LIST: raw.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  PAYMENT_CALLBACK_URL:
    raw.PAYMENT_CALLBACK_URL ?? `${raw.APP_BASE_URL.replace(/\/$/, '')}/checkout/complete`,
  MAX_UPLOAD_BYTES: raw.MAX_UPLOAD_MB * 1024 * 1024,
};

export type Env = typeof env;
