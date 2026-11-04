import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { audit } from '../../lib/audit';
import { created, ok } from '../../lib/response';
import { authenticate, optionalAuth } from '../../middleware/authenticate';
import { can, requirePermission } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import * as collections from './collections.service';

const router = Router();

const dateTime = z.string().datetime({ offset: true });

const listQuery = z.object({
  status: z.enum(['draft', 'active', 'archived', 'all']).optional(),
  releaseFrom: dateTime.optional(),
  releaseTo: dateTime.optional(),
  sort: z.enum(['release', 'created', 'title']).default('release'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

router.get(
  '/',
  optionalAuth,
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as z.infer<typeof listQuery>;
    ok(res, await collections.list(filters, can(req.user, 'collections:write')));
  }),
);

router.get(
  '/:idOrSlug',
  optionalAuth,
  asyncHandler(async (req, res) => {
    ok(res, await collections.getWithPieces(req.params.idOrSlug, can(req.user, 'collections:write')));
  }),
);

// ── Staff ─────────────────────────────────────────────────────────────
const baseFields = z.object({
  title: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens')
    .optional(),
  story: z.string().trim().max(10000).default(''),
  coverImageUrl: z.string().url().nullable().default(null),
  availableFrom: dateTime.nullable().default(null),
  availableUntil: dateTime.nullable().default(null),
});

const windowOk = (v: { availableFrom?: string | null; availableUntil?: string | null }) =>
  !v.availableFrom || !v.availableUntil || new Date(v.availableUntil) > new Date(v.availableFrom);
const windowMsg = { message: 'availableUntil must be after availableFrom', path: ['availableUntil'] };

const createBody = baseFields.strict().refine(windowOk, windowMsg);
const updateBody = baseFields.partial().strict().refine(windowOk, windowMsg);
const idParams = z.object({ id: z.string().min(1) });

router.post(
  '/',
  authenticate,
  requirePermission('collections:write'),
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    const c = await collections.create(req.body, req.user!.uid);
    audit(req.user, 'collection.create', 'collection', c.id);
    created(res, c);
  }),
);

router.patch(
  '/:id',
  authenticate,
  requirePermission('collections:write'),
  validate({ params: idParams, body: updateBody }),
  asyncHandler(async (req, res) => {
    const c = await collections.update(req.params.id, req.body);
    audit(req.user, 'collection.update', 'collection', c.id);
    ok(res, c);
  }),
);

router.post(
  '/:id/publish',
  authenticate,
  requirePermission('collections:write'),
  asyncHandler(async (req, res) => {
    const c = await collections.publish(req.params.id);
    audit(req.user, 'collection.publish', 'collection', c.id);
    ok(res, c);
  }),
);

router.post(
  '/:id/archive',
  authenticate,
  requirePermission('collections:write'),
  asyncHandler(async (req, res) => {
    const c = await collections.archive(req.params.id, 'manual');
    audit(req.user, 'collection.archive', 'collection', c.id);
    ok(res, c);
  }),
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('collections:write'),
  asyncHandler(async (req, res) => {
    await collections.remove(req.params.id);
    audit(req.user, 'collection.delete', 'collection', req.params.id);
    ok(res, { deleted: true });
  }),
);

export default router;
