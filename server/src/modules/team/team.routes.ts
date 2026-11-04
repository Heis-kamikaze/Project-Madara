import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { audit } from '../../lib/audit';
import { created, ok } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import * as team from './team.service';

const router = Router();

/** Public: portraits and the org chart. */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=60');
    ok(res, await team.getTeam());
  }),
);

const baseFields = z.object({
  name: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(100),
  bio: z.string().trim().max(2000).nullable().default(null),
  portraitUrl: z.string().url().nullable().default(null),
  parentId: z.string().min(1).nullable().default(null),
  order: z.number().int().min(0).max(100000).default(0),
});
const createBody = baseFields.strict();
const updateBody = baseFields.partial().strict();
const idParams = z.object({ id: z.string().min(1) });

router.post(
  '/',
  authenticate,
  requirePermission('team:write'),
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    const member = await team.create(req.body);
    audit(req.user, 'team.create', 'team', member.id);
    created(res, member);
  }),
);

router.patch(
  '/:id',
  authenticate,
  requirePermission('team:write'),
  validate({ params: idParams, body: updateBody }),
  asyncHandler(async (req, res) => {
    const member = await team.update(req.params.id, req.body);
    audit(req.user, 'team.update', 'team', member.id);
    ok(res, member);
  }),
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('team:write'),
  asyncHandler(async (req, res) => {
    await team.remove(req.params.id);
    audit(req.user, 'team.delete', 'team', req.params.id);
    ok(res, { deleted: true });
  }),
);

export default router;
