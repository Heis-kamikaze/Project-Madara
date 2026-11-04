import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { audit } from '../../lib/audit';
import { created, ok } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { strictLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import * as authenticity from './authenticity.service';

const router = Router();

const codeParams = z.object({ code: z.string().trim().min(6).max(40) });

/** Public: what the QR code opens. Tells a buyer whether the piece is genuine. */
router.get(
  '/verify/:code',
  strictLimiter,
  validate({ params: codeParams }),
  asyncHandler(async (req, res) => ok(res, await authenticity.verify(req.params.code))),
);

const claimBody = z
  .object({
    code: z.string().trim().min(6).max(40),
    shareLocation: z.boolean().default(false),
    country: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{2}$/, 'Use a 2-letter ISO country code, e.g. NG')
      .optional(),
    state: z.string().trim().min(1).max(60).optional(),
  })
  .strict()
  .refine((v) => !v.shareLocation || !!v.country, { message: 'country is required when shareLocation is true', path: ['country'] });

router.post(
  '/claim',
  authenticate,
  strictLimiter,
  validate({ body: claimBody }),
  asyncHandler(async (req, res) => ok(res, await authenticity.claim(req.user!, req.body))),
);

// ── Staff ─────────────────────────────────────────────────────────────
const generateBody = z
  .object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(50).default(1) })
  .strict();

router.post(
  '/codes',
  authenticate,
  requirePermission('authenticity:manage'),
  validate({ body: generateBody }),
  asyncHandler(async (req, res) => {
    const list = await authenticity.generateForProduct(req.body.productId, req.body.quantity);
    audit(req.user, 'authenticity.generate', 'product', req.body.productId, { quantity: list.length });
    created(res, list);
  }),
);

const listQuery = z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) });

router.get(
  '/codes',
  authenticate,
  requirePermission('authenticity:manage'),
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => ok(res, await authenticity.listCodes((req.query as unknown as z.infer<typeof listQuery>).limit))),
);

export default router;
