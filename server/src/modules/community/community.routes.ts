import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { audit } from '../../lib/audit';
import { created, ok } from '../../lib/response';
import { authenticate, optionalAuth } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { strictLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import * as community from './community.service';

const router = Router();

const listQuery = z.object({
  type: z.enum(['news', 'campaign', 'discussion']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});
const postParams = z.object({ id: z.string().min(1) });

router.get(
  '/posts',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const page = await community.listPublished(req.query as unknown as z.infer<typeof listQuery>);
    ok(res, page.items, { nextCursor: page.nextCursor });
  }),
);

router.get(
  '/posts/:id',
  optionalAuth,
  validate({ params: postParams }),
  asyncHandler(async (req, res) => ok(res, await community.getPost(req.params.id, req.user))),
);

const createBody = z
  .object({
    type: z.enum(['news', 'campaign', 'discussion']),
    title: z.string().trim().min(1).max(160),
    body: z.string().trim().min(1).max(10000),
    coverImageUrl: z.string().url().nullable().default(null),
  })
  .strict();

router.post(
  '/posts',
  authenticate,
  strictLimiter,
  validate({ body: createBody }),
  asyncHandler(async (req, res) => created(res, await community.createPost(req.user!, req.body))),
);

const patchBody = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    body: z.string().trim().min(1).max(10000).optional(),
    coverImageUrl: z.string().url().nullable().optional(),
    pinned: z.boolean().optional(),
  })
  .strict();

router.patch(
  '/posts/:id',
  authenticate,
  validate({ params: postParams, body: patchBody }),
  asyncHandler(async (req, res) => ok(res, await community.updatePost(req.user!, req.params.id, req.body))),
);

router.delete(
  '/posts/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    await community.deletePost(req.user!, req.params.id);
    ok(res, { deleted: true });
  }),
);

router.post(
  '/posts/:id/hide',
  authenticate,
  requirePermission('community:moderate'),
  asyncHandler(async (req, res) => {
    const post = await community.setHidden(req.params.id, true);
    audit(req.user, 'community.hide', 'post', post.id);
    ok(res, post);
  }),
);

router.post(
  '/posts/:id/unhide',
  authenticate,
  requirePermission('community:moderate'),
  asyncHandler(async (req, res) => {
    const post = await community.setHidden(req.params.id, false);
    audit(req.user, 'community.unhide', 'post', post.id);
    ok(res, post);
  }),
);

// ── Comments ──────────────────────────────────────────────────────────
const commentsQuery = z.object({ limit: z.coerce.number().int().min(1).max(200).default(100) });

router.get(
  '/posts/:id/comments',
  optionalAuth,
  validate({ query: commentsQuery }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof commentsQuery>;
    ok(res, await community.listComments(req.params.id, req.user, q.limit));
  }),
);

const commentBody = z.object({ body: z.string().trim().min(1).max(2000) }).strict();

router.post(
  '/posts/:id/comments',
  authenticate,
  strictLimiter,
  validate({ body: commentBody }),
  asyncHandler(async (req, res) => created(res, await community.addComment(req.user!, req.params.id, req.body.body))),
);

router.delete(
  '/posts/:postId/comments/:commentId',
  authenticate,
  asyncHandler(async (req, res) => {
    await community.deleteComment(req.user!, req.params.postId, req.params.commentId);
    ok(res, { deleted: true });
  }),
);

export default router;
