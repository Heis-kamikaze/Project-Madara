import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { audit } from '../../lib/audit';
import { created, ok } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import * as closet from './closet.service';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => ok(res, await closet.list(req.user!.uid))),
);

// ── Staff (declared before '/:id' so "admin" is not read as an id) ──────
const customPieceBody = z
  .object({
    userId: z.string().min(1),
    consultationId: z.string().min(1).optional(),
    title: z.string().trim().min(1).max(120),
    story: z.string().trim().max(5000).optional(),
    imageUrls: z.array(z.string().url()).max(8).default([]),
    status: z.enum(['in_production', 'ready']).default('in_production'),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

router.post(
  '/admin/custom-pieces',
  requirePermission('closet:manage'),
  validate({ body: customPieceBody }),
  asyncHandler(async (req, res) => {
    const result = await closet.createCustomPiece(req.body);
    audit(req.user, 'closet.custom.create', 'user', req.body.userId, { itemId: result.item.id, code: result.code.code });
    created(res, result);
  }),
);

const statusBody = z.object({ status: z.enum(['in_production', 'ready', 'delivered']) }).strict();

router.patch(
  '/admin/:uid/:id/status',
  requirePermission('closet:manage'),
  validate({ body: statusBody }),
  asyncHandler(async (req, res) => {
    const item = await closet.setItemStatus(req.params.uid, req.params.id, req.body.status);
    audit(req.user, 'closet.status', 'user', req.params.uid, { itemId: item.id, status: item.status });
    ok(res, item);
  }),
);

// ── Owner ─────────────────────────────────────────────────────────────
const patchBody = z
  .object({
    isFavorite: z.boolean().optional(),
    position: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).nullable().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

router.get(
  '/:id',
  asyncHandler(async (req, res) => ok(res, await closet.get(req.user!.uid, req.params.id))),
);

router.patch(
  '/:id',
  validate({ body: patchBody }),
  asyncHandler(async (req, res) => ok(res, await closet.updateOwn(req.user!.uid, req.params.id, req.body))),
);

export default router;
