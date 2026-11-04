import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { audit } from '../../lib/audit';
import { created, ok } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import * as consultations from './consultations.service';

const router = Router();
router.use(authenticate);

const dateTime = z.string().datetime({ offset: true });

const createBody = z
  .object({
    type: z.enum(['custom_piece', 'measurements', 'fitting', 'general']),
    requestedSlot: dateTime.refine((v) => new Date(v) > new Date(), 'Choose a time in the future'),
    notes: z.string().trim().max(2000).optional(),
    measurements: z.record(z.string().trim().min(1).max(40), z.number().positive().max(500)).optional(),
    referenceImageUrls: z.array(z.string().url()).max(8).default([]),
  })
  .strict();

const pageQuery = z.object({ limit: z.coerce.number().int().min(1).max(50).default(20), cursor: z.string().optional() });
const idParams = z.object({ id: z.string().min(1) });

router.post(
  '/',
  validate({ body: createBody }),
  asyncHandler(async (req, res) => created(res, await consultations.create(req.user!, req.body))),
);

router.get(
  '/mine',
  validate({ query: pageQuery }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof pageQuery>;
    const page = await consultations.listMine(req.user!.uid, q.limit, q.cursor);
    ok(res, page.items, { nextCursor: page.nextCursor });
  }),
);

const staffQuery = pageQuery.extend({ status: z.enum(['requested', 'confirmed', 'completed', 'cancelled']).optional() });

router.get(
  '/',
  requirePermission('consultations:read'),
  validate({ query: staffQuery }),
  asyncHandler(async (req, res) => {
    const page = await consultations.listAll(req.query as unknown as z.infer<typeof staffQuery>);
    ok(res, page.items, { nextCursor: page.nextCursor });
  }),
);

router.get(
  '/:id',
  validate({ params: idParams }),
  asyncHandler(async (req, res) => ok(res, await consultations.getForUser(req.params.id, req.user!))),
);

router.post(
  '/:id/cancel',
  validate({ params: idParams }),
  asyncHandler(async (req, res) => ok(res, await consultations.cancelOwn(req.params.id, req.user!))),
);

const staffPatch = z
  .object({
    status: z.enum(['confirmed', 'completed', 'cancelled']).optional(),
    scheduledAt: dateTime.nullable().optional(),
    adminNotes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

router.patch(
  '/:id',
  requirePermission('consultations:write'),
  validate({ params: idParams, body: staffPatch }),
  asyncHandler(async (req, res) => {
    const c = await consultations.staffUpdate(req.params.id, req.body);
    audit(req.user, 'consultation.update', 'consultation', c.id, { status: c.status });
    ok(res, c);
  }),
);

export default router;
