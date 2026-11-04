import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { audit } from '../../lib/audit';
import { created, ok } from '../../lib/response';
import { authenticate, optionalAuth } from '../../middleware/authenticate';
import { can, requirePermission } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import * as museum from './museum.service';

const router = Router();

/** Public gallery of curated custom pieces. Staff can pass ?all=true to include unpublished entries. */
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const staffAll = req.query.all === 'true' && can(req.user, 'museum:write');
    ok(res, staffAll ? await museum.listAll() : await museum.listPublic());
  }),
);

router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => ok(res, await museum.get(req.params.id, can(req.user, 'museum:write')))),
);

const baseFields = z.object({
  title: z.string().trim().min(1).max(120),
  story: z.string().trim().max(5000).default(''),
  imageUrls: z.array(z.string().url()).max(12).default([]),
  clientConsent: z.boolean().default(false),
  published: z.boolean().default(false),
  order: z.number().int().min(0).max(100000).default(0),
});
const createBody = baseFields.strict();
const updateBody = baseFields.partial().strict();
const idParams = z.object({ id: z.string().min(1) });

router.post(
  '/',
  authenticate,
  requirePermission('museum:write'),
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    const entry = await museum.create(req.body);
    audit(req.user, 'museum.create', 'museum', entry.id);
    created(res, entry);
  }),
);

router.patch(
  '/:id',
  authenticate,
  requirePermission('museum:write'),
  validate({ params: idParams, body: updateBody }),
  asyncHandler(async (req, res) => {
    const entry = await museum.update(req.params.id, req.body);
    audit(req.user, 'museum.update', 'museum', entry.id);
    ok(res, entry);
  }),
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('museum:write'),
  asyncHandler(async (req, res) => {
    await museum.remove(req.params.id);
    audit(req.user, 'museum.delete', 'museum', req.params.id);
    ok(res, { deleted: true });
  }),
);

export default router;
