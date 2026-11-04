import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { audit } from '../../lib/audit';
import { created, ok } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { addressSchema } from '../users/users.routes';
import * as orders from './orders.service';

const router = Router();
router.use(authenticate);

// `.strict()` is deliberate: pieces in a collection cannot be customised, so any
// extra field (colour, design tweaks…) is rejected. Custom work goes through /consultations.
const createBody = z
  .object({
    items: z
      .array(
        z
          .object({
            productId: z.string().min(1),
            quantity: z.number().int().min(1).max(10),
            size: z.string().trim().min(1).max(20).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(20),
    shippingAddress: addressSchema,
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

const pageQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});
const idParams = z.object({ id: z.string().min(1) });

router.post(
  '/',
  validate({ body: createBody }),
  asyncHandler(async (req, res) => created(res, await orders.createOrder(req.user!, req.body))),
);

router.get(
  '/mine',
  validate({ query: pageQuery }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof pageQuery>;
    const page = await orders.listMine(req.user!.uid, q.limit, q.cursor);
    ok(res, page.items, { nextCursor: page.nextCursor });
  }),
);

// ── Staff list (declared before '/:id') ────────────────────────────────
const staffQuery = pageQuery.extend({
  status: z
    .enum(['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'needs_attention', 'cancelled', 'refunded'])
    .optional(),
});

router.get(
  '/',
  requirePermission('orders:read'),
  validate({ query: staffQuery }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof staffQuery>;
    const page = await orders.listAll(q);
    ok(res, page.items, { nextCursor: page.nextCursor });
  }),
);

router.get(
  '/:id',
  validate({ params: idParams }),
  asyncHandler(async (req, res) => ok(res, await orders.getForUser(req.params.id, req.user!))),
);

router.post(
  '/:id/cancel',
  validate({ params: idParams }),
  asyncHandler(async (req, res) => ok(res, await orders.cancelOwn(req.params.id, req.user!))),
);

const statusBody = z
  .object({
    status: z.enum(['processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    note: z.string().trim().max(500).optional(),
  })
  .strict();

router.patch(
  '/:id/status',
  requirePermission('orders:write'),
  validate({ params: idParams, body: statusBody }),
  asyncHandler(async (req, res) => {
    const order = await orders.updateStatus(req.params.id, req.body.status, req.body.note);
    audit(req.user, 'order.status', 'order', order.id, { status: req.body.status });
    ok(res, order);
  }),
);

export default router;
