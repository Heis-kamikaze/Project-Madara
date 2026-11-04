import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { audit } from '../../lib/audit';
import { notFound } from '../../lib/errors';
import { created, ok } from '../../lib/response';
import { db } from '../../config/firebase';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import * as inbox from './inbox.service';

const router = Router();
router.use(authenticate);

const listQuery = z.object({
  unread: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
const idParams = z.object({ id: z.string().min(1) });

router.get(
  '/',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof listQuery>;
    const [items, unread] = await Promise.all([
      inbox.list(req.user!.uid, { unreadOnly: q.unread, limit: q.limit }),
      inbox.unreadCount(req.user!.uid),
    ]);
    ok(res, items, { unread });
  }),
);

router.get(
  '/unread-count',
  asyncHandler(async (req, res) => ok(res, { unread: await inbox.unreadCount(req.user!.uid) })),
);

router.post(
  '/read-all',
  asyncHandler(async (req, res) => ok(res, { updated: await inbox.markAllRead(req.user!.uid) })),
);

router.patch(
  '/:id/read',
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    await inbox.markRead(req.user!.uid, req.params.id);
    ok(res, { read: true });
  }),
);

router.delete(
  '/:id',
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    await inbox.remove(req.user!.uid, req.params.id);
    ok(res, { deleted: true });
  }),
);

// ── Staff: send a message to a customer (production updates, fitting appointments…) ──
const sendBody = z
  .object({
    userId: z.string().min(1),
    type: z.enum(['order', 'consultation', 'production', 'system', 'support', 'general']).default('general'),
    title: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(2000),
    link: z.string().startsWith('/').max(200).optional(),
    mirrorToEmail: z.boolean().default(true),
  })
  .strict();

router.post(
  '/send',
  requirePermission('inbox:send'),
  validate({ body: sendBody }),
  asyncHandler(async (req, res) => {
    const b = req.body as z.infer<typeof sendBody>;
    const user = await db.collection('users').doc(b.userId).get();
    if (!user.exists) throw notFound('Recipient not found');
    const id = await inbox.sendMessage(b.userId, { type: b.type, title: b.title, body: b.body, link: b.link }, { mirrorToEmail: b.mirrorToEmail });
    audit(req.user, 'inbox.send', 'user', b.userId, { messageId: id });
    created(res, { id });
  }),
);

export default router;
