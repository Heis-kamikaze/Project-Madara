import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { audit } from '../../lib/audit';
import { created, ok } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { strictLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import * as support from './support.service';

const router = Router();
router.use(authenticate);

const textBody = z.object({ text: z.string().trim().min(1).max(2000) }).strict();
const idParams = z.object({ id: z.string().min(1) });
const pageQuery = z.object({ limit: z.coerce.number().int().min(1).max(50).default(20), cursor: z.string().optional() });

/** Customer opens the chat box and sends the first message. */
router.post(
  '/conversations',
  strictLimiter,
  validate({ body: textBody }),
  asyncHandler(async (req, res) => created(res, await support.startConversation(req.user!, req.body.text))),
);

router.get(
  '/conversations/mine',
  validate({ query: pageQuery }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof pageQuery>;
    const page = await support.listMine(req.user!.uid, q.limit, q.cursor);
    ok(res, page.items, { nextCursor: page.nextCursor });
  }),
);

const staffQuery = pageQuery.extend({ status: z.enum(['open', 'resolved']).optional() });

router.get(
  '/conversations',
  requirePermission('support:read'),
  validate({ query: staffQuery }),
  asyncHandler(async (req, res) => {
    const page = await support.listAll(req.query as unknown as z.infer<typeof staffQuery>);
    ok(res, page.items, { nextCursor: page.nextCursor });
  }),
);

const messagesQuery = z.object({
  afterId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

/** Poll with ?afterId=<last message id> every few seconds to receive new messages. */
router.get(
  '/conversations/:id/messages',
  validate({ params: idParams, query: messagesQuery }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof messagesQuery>;
    ok(res, await support.getMessages(req.user!, req.params.id, q));
  }),
);

router.post(
  '/conversations/:id/messages',
  strictLimiter,
  validate({ params: idParams, body: textBody }),
  asyncHandler(async (req, res) => created(res, await support.postMessage(req.user!, req.params.id, req.body.text))),
);

router.post(
  '/conversations/:id/handoff',
  validate({ params: idParams }),
  asyncHandler(async (req, res) => ok(res, await support.requestHuman(req.user!, req.params.id))),
);

const staffPatch = z
  .object({ status: z.enum(['open', 'resolved']).optional(), assignedTo: z.string().min(1).nullable().optional() })
  .strict();

router.patch(
  '/conversations/:id',
  requirePermission('support:reply'),
  validate({ params: idParams, body: staffPatch }),
  asyncHandler(async (req, res) => {
    const conv = await support.staffUpdate(req.params.id, req.body);
    audit(req.user, 'support.update', 'conversation', conv.id, req.body);
    ok(res, conv);
  }),
);

export default router;
