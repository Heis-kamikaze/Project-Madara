import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { audit } from '../../lib/audit';
import { created, ok } from '../../lib/response';
import { authenticate, optionalAuth } from '../../middleware/authenticate';
import { can, requirePermission } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import * as products from './products.service';

const router = Router();
const dateTime = z.string().datetime({ offset: true });

const listQuery = z.object({
  collectionId: z.string().min(1).optional(),
  status: z.enum(['draft', 'active', 'sold_out', 'archived', 'all']).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  releasedFrom: dateTime.optional(),
  releasedTo: dateTime.optional(),
  q: z.string().trim().min(1).max(80).optional(),
  sort: z.enum(['price', 'date', 'release']).default('release'),
  order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(200).default(60),
});

router.get(
  '/',
  optionalAuth,
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as z.infer<typeof listQuery>;
    ok(res, await products.list(filters, can(req.user, 'products:write')));
  }),
);

router.get(
  '/:idOrSlug',
  optionalAuth,
  asyncHandler(async (req, res) => ok(res, await products.get(req.params.idOrSlug, can(req.user, 'products:write')))),
);

// ── Staff ─────────────────────────────────────────────────────────────
// Pieces inside collections have FIXED colours and designs. Customers cannot customise them;
// custom requests go through /consultations instead.
const baseFields = z.object({
  collectionId: z.string().min(1).nullable().default(null),
  title: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens')
    .optional(),
  story: z.string().trim().max(10000).default(''),
  priceNgn: z.number().int().min(0).max(100_000_000),
  colorName: z.string().trim().min(1).max(40),
  colorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour like #1a1a1a')
    .nullable()
    .default(null),
  sizes: z.array(z.string().trim().min(1).max(20)).max(20).default([]),
  imageUrls: z.array(z.string().url()).max(12).default([]),
  stock: z.number().int().min(0).max(100000).default(1),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  releaseAt: dateTime.nullable().default(null),
});

const createBody = baseFields.strict();
const updateBody = baseFields.partial().strict();
const idParams = z.object({ id: z.string().min(1) });

router.post(
  '/',
  authenticate,
  requirePermission('products:write'),
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    const p = await products.create(req.body, req.user!.uid);
    audit(req.user, 'product.create', 'product', p.id);
    created(res, p);
  }),
);

router.patch(
  '/:id',
  authenticate,
  requirePermission('products:write'),
  validate({ params: idParams, body: updateBody }),
  asyncHandler(async (req, res) => {
    const p = await products.update(req.params.id, req.body);
    audit(req.user, 'product.update', 'product', p.id);
    ok(res, p);
  }),
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('products:write'),
  asyncHandler(async (req, res) => {
    await products.remove(req.params.id);
    audit(req.user, 'product.delete', 'product', req.params.id);
    ok(res, { deleted: true });
  }),
);

export default router;
