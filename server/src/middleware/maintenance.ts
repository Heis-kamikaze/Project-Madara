import { timingSafeEqual } from 'crypto';
import type { RequestHandler } from 'express';
import { env } from '../config/env';

const safeEqual = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

/**
 * When MAINTENANCE_MODE=true the public API answers 503. Health checks, the
 * payment webhook (so in-flight payments are still recorded) and requests that
 * carry the `x-maintenance-bypass` header stay available.
 */
export const maintenance: RequestHandler = (req, res, next) => {
  if (!env.MAINTENANCE_MODE) return next();
  if (req.path === '/health' || req.path.endsWith('/payments/webhook')) return next();
  const bypass = req.header('x-maintenance-bypass');
  if (env.MAINTENANCE_BYPASS_TOKEN && bypass && safeEqual(bypass, env.MAINTENANCE_BYPASS_TOKEN)) return next();
  res.status(503).json({ error: { code: 'MAINTENANCE', message: 'Aradam is temporarily unavailable. Please check back soon.' } });
};
