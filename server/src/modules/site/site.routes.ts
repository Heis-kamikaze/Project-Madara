import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { audit } from '../../lib/audit';
import { ok } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import * as site from './site.service';

const router = Router();

/** Public: everything the landing page needs (video background, headline, donut menu items). */
router.get(
  '/landing',
  asyncHandler(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=60');
    ok(res, await site.getLanding());
  }),
);

const landingBody = z
  .object({
    heroVideoUrl: z.string().url().nullable().optional(),
    heroPosterUrl: z.string().url().nullable().optional(),
    headline: z.string().trim().min(1).max(120).optional(),
    subheadline: z.string().trim().max(240).nullable().optional(),
    featuredCollectionId: z.string().nullable().optional(),
  })
  .strict();

/** Staff: swap the landing video when a new collection drops. */
router.put(
  '/landing',
  authenticate,
  requirePermission('site:write'),
  validate({ body: landingBody }),
  asyncHandler(async (req, res) => {
    const landing = await site.updateLanding(req.body);
    audit(req.user, 'site.landing.update', 'siteConfig', 'landing');
    ok(res, landing);
  }),
);

export default router;
