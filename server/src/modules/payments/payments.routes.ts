import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { badRequest, unauthorized } from '../../lib/errors';
import { ok } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { strictLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import * as payments from './payments.service';

const router = Router();

/**
 * Paystack → API. No user token; authenticity comes from the HMAC signature header.
 * Configure the URL in the Paystack dashboard: {API_URL}/api/v1/payments/webhook
 */
router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    if (!req.rawBody) throw badRequest('Missing request body');
    if (!payments.isValidSignature(req.rawBody, req.header('x-paystack-signature'))) {
      throw unauthorized('Invalid webhook signature', 'INVALID_SIGNATURE');
    }
    await payments.handleWebhookEvent(req.body);
    res.sendStatus(200);
  }),
);

const initBody = z.object({ orderId: z.string().min(1) }).strict();

router.post(
  '/initialize',
  authenticate,
  strictLimiter,
  validate({ body: initBody }),
  asyncHandler(async (req, res) => ok(res, await payments.initialize(req.body.orderId, req.user!))),
);

router.get(
  '/verify/:reference',
  authenticate,
  asyncHandler(async (req, res) => {
    const { order, paid } = await payments.verify(req.params.reference, req.user!);
    ok(res, { paid, orderId: order.id, orderNumber: order.orderNumber, status: order.status, paymentStatus: order.paymentStatus });
  }),
);

export default router;
