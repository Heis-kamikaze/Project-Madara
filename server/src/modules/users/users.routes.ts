import { Router } from 'express';
import { z } from 'zod';
import { ROLES } from '../../config/permissions';
import { asyncHandler } from '../../lib/asyncHandler';
import { audit } from '../../lib/audit';
import { ok } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import * as users from './users.service';

const router = Router();
router.use(authenticate);

export const addressSchema = z.object({
  fullName: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(30).optional(),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  country: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().max(20).optional(),
});

const patchMe = z
  .object({
    displayName: z.string().trim().min(1).max(80).optional(),
    phone: z.string().trim().max(30).nullable().optional(),
    address: addressSchema.nullable().optional(),
    marketingOptIn: z.boolean().optional(),
  })
  .strict();

router.get(
  '/me',
  asyncHandler(async (req, res) => ok(res, await users.getUser(req.user!.uid))),
);

router.patch(
  '/me',
  validate({ body: patchMe }),
  asyncHandler(async (req, res) => ok(res, await users.updateProfile(req.user!.uid, req.body))),
);

// ── Staff ─────────────────────────────────────────────────────────────
const listQuery = z.object({
  role: z.enum(ROLES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().optional(),
});

router.get(
  '/',
  requirePermission('users:read'),
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const page = await users.listUsers(req.query as unknown as z.infer<typeof listQuery>);
    ok(res, page.items, { nextCursor: page.nextCursor });
  }),
);

router.get(
  '/:uid',
  requirePermission('users:read'),
  asyncHandler(async (req, res) => ok(res, await users.getUser(req.params.uid))),
);

const roleBody = z.object({ role: z.enum(ROLES) }).strict();

router.patch(
  '/:uid/role',
  requirePermission('users:manage-roles'),
  validate({ body: roleBody }),
  asyncHandler(async (req, res) => {
    const profile = await users.setRole(req.user!, req.params.uid, req.body.role);
    audit(req.user, 'user.role.set', 'user', req.params.uid, { role: req.body.role });
    ok(res, profile);
  }),
);

export default router;
