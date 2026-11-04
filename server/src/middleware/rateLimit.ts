import type { RequestHandler } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env';

const handler: RequestHandler = (_req, res) => {
  res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down and try again shortly.' } });
};

/** Applied to the whole API. */
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
});

/**
 * For endpoints that are cheap to abuse: sign-up, public lookups, chat, comments, uploads.
 * Signed-in callers are counted per account (many customers can share one mobile-network IP);
 * anonymous callers are counted per IP.
 */
export const strictLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? `uid:${req.user.uid}` : ipKeyGenerator(req.ip ?? '')),
  handler,
});
