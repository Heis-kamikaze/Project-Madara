import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { ok } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import * as admin from './admin.service';

const router = Router();
router.use(authenticate);

router.get(
  '/stats',
  requirePermission('analytics:read'),
  asyncHandler(async (_req, res) => ok(res, await admin.stats())),
);

/** The role → permission matrix, so the admin UI can explain what each role can do. */
router.get(
  '/roles',
  requirePermission('users:read'),
  asyncHandler(async (_req, res) => ok(res, admin.roleMatrix())),
);

const logQuery = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50), cursor: z.string().optional() });

router.get(
  '/audit-logs',
  requirePermission('audit:read'),
  validate({ query: logQuery }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof logQuery>;
    const page = await admin.auditLogs(q.limit, q.cursor);
    ok(res, page.items, { nextCursor: page.nextCursor });
  }),
);

export default router;
