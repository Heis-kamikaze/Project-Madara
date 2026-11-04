import { Router } from 'express';
import { z } from 'zod';
import { ROLE_PERMISSIONS } from '../../config/permissions';
import { asyncHandler } from '../../lib/asyncHandler';
import { created, ok } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { strictLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import * as users from '../users/users.service';

const router = Router();

const registerBody = z
  .object({
    displayName: z.string().trim().min(1).max(80).optional(),
    phone: z.string().trim().max(30).optional(),
    marketingOptIn: z.boolean().optional(),
  })
  .strict();

/**
 * Sign-up and sign-in themselves happen in the browser/app with the Firebase
 * client SDK. After the first sign-in, the client calls this endpoint once so
 * the backend creates the customer profile. It is safe to call repeatedly.
 */
router.post(
  '/register',
  strictLimiter,
  authenticate,
  validate({ body: registerBody }),
  asyncHandler(async (req, res) => {
    const { profile, created: isNew } = await users.ensureProfile(req.user!, req.body);
    if (isNew) created(res, profile);
    else ok(res, profile);
  }),
);

/** Current user, role and permission list — the frontend uses this to show/hide admin UI. */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const profile = await users.getProfile(req.user!.uid);
    ok(res, {
      uid: req.user!.uid,
      email: req.user!.email,
      emailVerified: req.user!.emailVerified,
      role: req.user!.role,
      permissions: ROLE_PERMISSIONS[req.user!.role],
      profile,
    });
  }),
);

export default router;
