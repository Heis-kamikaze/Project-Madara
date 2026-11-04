import { timingSafeEqual } from 'crypto';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env';
import { asyncHandler } from '../../lib/asyncHandler';
import { unauthorized } from '../../lib/errors';
import { ok } from '../../lib/response';
import { validate } from '../../middleware/validate';
import { JOB_NAMES, run } from './jobs.service';

const router = Router();

const safeEqual = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

const body = z.object({ job: z.enum([...JOB_NAMES, 'all']).default('all') }).strict();

/** Trigger from Cloud Scheduler / cron: POST with header `x-cron-secret: <CRON_SECRET>`. */
router.post(
  '/run',
  validate({ body }),
  asyncHandler(async (req, res) => {
    if (!safeEqual(req.header('x-cron-secret') ?? '', env.CRON_SECRET)) throw unauthorized('Invalid cron secret', 'INVALID_CRON_SECRET');
    ok(res, await run(req.body.job));
  }),
);

export default router;
