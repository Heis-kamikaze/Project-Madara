import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '../../config/env';
import { AppError, badRequest, conflict, forbidden } from '../../lib/errors';
import { randomCode } from '../../lib/ids';
import { logger } from '../../lib/logger';
import { can } from '../../middleware/authorize';
import type { AuthUser } from '../../types/express';
import type { Order } from '../../types/models';
import * as orders from '../orders/orders.service';

interface PaystackEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

async function paystack<T>(path: string, init: { method?: 'GET' | 'POST'; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${env.PAYSTACK_BASE_URL}${path}`, {
      method: init.method ?? 'GET',
      headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch (err) {
    logger.error('Could not reach Paystack', err);
    throw new AppError(502, 'PAYMENT_PROVIDER_UNREACHABLE', 'The payment provider could not be reached. Please try again.');
  }
  const json = (await res.json().catch(() => null)) as PaystackEnvelope<T> | null;
  if (!res.ok || !json || json.status !== true) {
    logger.warn('Paystack returned an error', { status: res.status, message: json?.message });
    throw new AppError(502, 'PAYMENT_PROVIDER_ERROR', json?.message ?? 'The payment provider rejected the request');
  }
  return json.data;
}

export interface InitializedPayment {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  amountNgn: number;
}

/** Starts a Paystack checkout for one of the caller's unpaid orders. */
export async function initialize(orderId: string, user: AuthUser): Promise<InitializedPayment> {
  const order = await orders.getRaw(orderId);
  if (order.userId !== user.uid) throw forbidden('This is not your order');
  if (order.status !== 'pending_payment') throw conflict('This order is not awaiting payment', 'INVALID_STATE');
  const email = order.userEmail ?? user.email;
  if (!email) throw badRequest('Your account needs an email address before you can pay', undefined, 'EMAIL_REQUIRED');
  if (order.totalNgn <= 0) throw badRequest('This order has nothing to pay', undefined, 'NOTHING_TO_PAY');

  const reference = `${order.orderNumber}-${randomCode(6)}`;
  const data = await paystack<{ authorization_url: string; access_code: string; reference: string }>('/transaction/initialize', {
    method: 'POST',
    body: {
      email,
      amount: order.totalNgn * 100, // Paystack works in kobo
      currency: 'NGN',
      reference,
      callback_url: env.PAYMENT_CALLBACK_URL,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    },
  });

  await orders.setPaymentReference(order.id, data.reference);
  return { authorizationUrl: data.authorization_url, accessCode: data.access_code, reference: data.reference, amountNgn: order.totalNgn };
}

interface PaystackTransaction {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  metadata?: { orderId?: string } | null;
}

/** Called when the customer returns from Paystack; confirms with Paystack instead of trusting the browser. */
export async function verify(reference: string, user: AuthUser): Promise<{ order: Order; paid: boolean }> {
  const order = await orders.findByReference(reference);
  if (!order || (order.userId !== user.uid && !can(user, 'orders:read'))) {
    throw new AppError(404, 'NOT_FOUND', 'No order found for that payment reference');
  }

  const tx = await paystack<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
  if (tx.status !== 'success') return { order, paid: false };

  const result = await orders.markPaid(order.id, { reference, amountKobo: tx.amount, currency: tx.currency });
  return { order: result.order, paid: result.outcome !== 'needs_attention' };
}

export function isValidSignature(rawBody: Buffer, signature: string | undefined): boolean {
  if (!signature) return false;
  const expected = createHmac('sha512', env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface PaystackEvent {
  event: string;
  data?: PaystackTransaction;
}

/** Handles a verified webhook. Unknown events are acknowledged and ignored. */
export async function handleWebhookEvent(event: PaystackEvent): Promise<void> {
  if (event.event !== 'charge.success' || !event.data) return;
  const { reference, amount, currency, metadata } = event.data;

  const order = metadata?.orderId ? await orders.getRaw(metadata.orderId).catch(() => null) : await orders.findByReference(reference);
  if (!order) {
    logger.warn(`Webhook for unknown order (reference ${reference})`);
    return;
  }
  await orders.markPaid(order.id, { reference, amountKobo: amount, currency });
}
