import { FieldValue, Timestamp, db } from '../../config/firebase';
import { env } from '../../config/env';
import { conflict, forbidden, notFound } from '../../lib/errors';
import { paginate, snapToObject } from '../../lib/firestore';
import { logger } from '../../lib/logger';
import { orderNumber } from '../../lib/ids';
import type { AuthUser } from '../../types/express';
import type { Address, Collection, Order, OrderItem, OrderStatus, Product } from '../../types/models';
import { can } from '../../middleware/authorize';
import * as collectionsService from '../collections/collections.service';
import * as inbox from '../inbox/inbox.service';

const orders = db.collection('orders');
const products = db.collection('products');
const collections = db.collection('collections');

export interface CreateOrderInput {
  items: { productId: string; quantity: number; size?: string }[];
  shippingAddress: Address;
  notes?: string;
}

function quantities(items: Pick<OrderItem, 'productId' | 'quantity'>[]): Map<string, number> {
  const map = new Map<string, number>();
  items.forEach((i) => map.set(i.productId, (map.get(i.productId) ?? 0) + i.quantity));
  return map;
}

/**
 * Creates an order in `pending_payment`. Prices, names and availability are always
 * read from the database — the client only says WHICH pieces and HOW MANY.
 * Stock is checked here but only deducted once payment is confirmed.
 */
export async function createOrder(user: AuthUser, input: CreateOrderInput): Promise<Order> {
  const qty = quantities(input.items);
  const productIds = [...qty.keys()];

  const productSnaps = await db.getAll(...productIds.map((id) => products.doc(id)));
  const productById = new Map<string, Product>();
  productSnaps.forEach((s) => {
    if (s.exists) productById.set(s.id, snapToObject<Product>(s));
  });
  const missing = productIds.filter((id) => !productById.has(id));
  if (missing.length) throw notFound(`Piece not found: ${missing.join(', ')}`, 'PRODUCT_NOT_FOUND');

  const collectionIds = [...new Set([...productById.values()].map((p) => p.collectionId).filter((x): x is string => !!x))];
  const collectionById = new Map<string, Collection>();
  if (collectionIds.length) {
    const snaps = await db.getAll(...collectionIds.map((id) => collections.doc(id)));
    snaps.forEach((s) => {
      if (s.exists) collectionById.set(s.id, snapToObject<Collection>(s));
    });
  }

  for (const [productId, wanted] of qty) {
    const p = productById.get(productId)!;
    if (p.status === 'draft') throw notFound(`Piece not found: ${productId}`, 'PRODUCT_NOT_FOUND');

    if (p.collectionId) {
      const c = collectionById.get(p.collectionId);
      if (!c || c.status === 'draft') throw notFound(`Piece not found: ${productId}`, 'PRODUCT_NOT_FOUND');
      if (!collectionsService.isOrderable(c)) {
        if (c.status === 'active' && collectionsService.availabilityOf(c) === 'upcoming') {
          throw conflict(`"${c.title}" is not open for orders yet.`, 'COLLECTION_NOT_LIVE', { collectionId: c.id });
        }
        throw conflict(
          `"${c.title}" has been archived and can no longer be ordered. Use the help button if you need assistance.`,
          'COLLECTION_ARCHIVED',
          { collectionId: c.id, showHelp: true },
        );
      }
    }

    if (p.status === 'sold_out' || p.stock <= 0) throw conflict(`"${p.title}" is sold out.`, 'SOLD_OUT', { productId });
    if (p.status !== 'active') throw conflict(`"${p.title}" is not available.`, 'PRODUCT_UNAVAILABLE', { productId });
    if (wanted > p.stock) {
      throw conflict(`Only ${p.stock} of "${p.title}" left.`, 'INSUFFICIENT_STOCK', { productId, available: p.stock });
    }
  }

  const items: OrderItem[] = input.items.map((line) => {
    const p = productById.get(line.productId)!;
    if (p.sizes.length > 0) {
      if (!line.size || !p.sizes.includes(line.size)) {
        throw conflict(`Choose a size for "${p.title}": ${p.sizes.join(', ')}`, 'SIZE_REQUIRED', { productId: p.id, sizes: p.sizes });
      }
    } else if (line.size) {
      throw conflict(`"${p.title}" does not come in sizes`, 'SIZE_NOT_APPLICABLE', { productId: p.id });
    }
    return {
      productId: p.id,
      collectionId: p.collectionId,
      title: p.title,
      imageUrl: p.imageUrls[0] ?? null,
      size: line.size ?? null,
      quantity: line.quantity,
      unitPriceNgn: p.priceNgn,
    };
  });

  const subtotalNgn = items.reduce((sum, i) => sum + i.unitPriceNgn * i.quantity, 0);
  const shippingFeeNgn = env.SHIPPING_FLAT_FEE_NGN;

  const ref = orders.doc();
  await ref.set({
    orderNumber: orderNumber(),
    userId: user.uid,
    userEmail: user.email,
    items,
    subtotalNgn,
    shippingFeeNgn,
    totalNgn: subtotalNgn + shippingFeeNgn,
    currency: 'NGN',
    shippingAddress: input.shippingAddress,
    notes: input.notes ?? null,
    status: 'pending_payment',
    paymentStatus: 'unpaid',
    paymentReference: null,
    stockDeducted: false,
    paidAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return snapToObject<Order>(await ref.get());
}

export async function getRaw(id: string): Promise<Order> {
  const snap = await orders.doc(id).get();
  if (!snap.exists) throw notFound('Order not found');
  return snapToObject<Order>(snap);
}

/** Customers see only their own orders; staff with `orders:read` see all. Others get a 404. */
export async function getForUser(id: string, user: AuthUser): Promise<Order> {
  const order = await getRaw(id);
  if (order.userId !== user.uid && !can(user, 'orders:read')) throw notFound('Order not found');
  return order;
}

export async function findByReference(reference: string): Promise<Order | null> {
  const snaps = await orders.where('paymentReference', '==', reference).limit(1).get();
  return snaps.empty ? null : snapToObject<Order>(snaps.docs[0]);
}

export async function setPaymentReference(id: string, reference: string): Promise<void> {
  await orders.doc(id).update({ paymentReference: reference, updatedAt: FieldValue.serverTimestamp() });
}

export function listMine(uid: string, limit: number, cursor?: string) {
  return paginate<Order>(orders.where('userId', '==', uid).orderBy('createdAt', 'desc'), orders, limit, cursor);
}

export function listAll(opts: { status?: OrderStatus; limit: number; cursor?: string }) {
  const base = opts.status ? orders.where('status', '==', opts.status) : orders;
  return paginate<Order>(base.orderBy('createdAt', 'desc'), orders, opts.limit, opts.cursor);
}

export async function cancelOwn(id: string, user: AuthUser): Promise<Order> {
  const order = await getRaw(id);
  if (order.userId !== user.uid) throw forbidden('This is not your order');
  if (order.status !== 'pending_payment') {
    throw conflict('Only orders that have not been paid can be cancelled here. Please contact support.', 'INVALID_STATE');
  }
  await orders.doc(id).update({ status: 'cancelled', cancelReason: 'customer', updatedAt: FieldValue.serverTimestamp() });
  return getRaw(id);
}

// ── Payment confirmation ──────────────────────────────────────────────

export type PaidOutcome = 'paid' | 'already_paid' | 'needs_attention';

/**
 * Idempotent. Called by the Paystack webhook AND by the verify endpoint, so it can run
 * twice for the same payment. Inside one transaction it checks the amount, re-checks
 * stock and deducts it. If anything does not add up the order is flagged
 * `needs_attention` (money received, order not fulfilable) for a human to resolve/refund.
 */
export async function markPaid(
  orderId: string,
  payment: { reference: string; amountKobo: number; currency: string },
): Promise<{ outcome: PaidOutcome; order: Order }> {
  const orderRef = orders.doc(orderId);

  const outcome = await db.runTransaction(async (tx): Promise<{ outcome: PaidOutcome; reason?: string }> => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) throw notFound('Order not found');
    const order = snapToObject<Order>(orderSnap);

    if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') return { outcome: 'already_paid' };

    const qty = quantities(order.items);
    const productRefs = [...qty.keys()].map((id) => products.doc(id));
    const productSnaps = productRefs.length ? await tx.getAll(...productRefs) : [];

    let problem: string | null = null;
    if (order.status === 'cancelled') problem = 'order_was_cancelled';
    else if (payment.currency !== 'NGN' || payment.amountKobo !== order.totalNgn * 100) problem = 'amount_mismatch';
    else {
      for (const s of productSnaps) {
        const wanted = qty.get(s.id) ?? 0;
        const p = s.exists ? snapToObject<Product>(s) : null;
        if (!p || p.stock < wanted || (p.status !== 'active' && p.status !== 'sold_out' && p.status !== 'archived')) {
          problem = 'stock_conflict';
          break;
        }
      }
    }

    const base = {
      paymentStatus: 'paid',
      paymentReference: payment.reference,
      paidAmountKobo: payment.amountKobo,
      paidAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (problem) {
      tx.update(orderRef, { ...base, status: 'needs_attention', attentionReason: problem, stockDeducted: false });
      return { outcome: 'needs_attention', reason: problem };
    }

    for (const s of productSnaps) {
      const p = snapToObject<Product>(s);
      const remaining = p.stock - (qty.get(s.id) ?? 0);
      tx.update(s.ref, {
        stock: remaining,
        status: remaining === 0 && p.status === 'active' ? 'sold_out' : p.status,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    tx.update(orderRef, { ...base, status: 'paid', stockDeducted: true });
    return { outcome: 'paid' };
  });

  const order = await getRaw(orderId);

  if (outcome.outcome === 'paid') {
    await inbox.sendMessage(order.userId, {
      type: 'order',
      title: `Payment received — ${order.orderNumber}`,
      body: 'Thank you! Your payment was successful and your order is confirmed. We will update you here as it moves along.',
      link: `/account/orders/${order.id}`,
    });
    const affected = [...new Set(order.items.map((i) => i.collectionId).filter((x): x is string => !!x))];
    for (const collectionId of affected) {
      try {
        await collectionsService.archiveIfSoldOut(collectionId);
      } catch (err) {
        logger.warn(`Could not run sold-out check for collection ${collectionId}`, err);
      }
    }
  } else if (outcome.outcome === 'needs_attention') {
    logger.warn(`Order ${order.orderNumber} needs attention: ${outcome.reason}`);
    await inbox.sendMessage(order.userId, {
      type: 'order',
      title: `We are reviewing your order — ${order.orderNumber}`,
      body: 'We received your payment but need to check something on your order. Our team will contact you shortly; you will not be charged twice.',
      link: `/account/orders/${order.id}`,
    });
  }

  return { outcome: outcome.outcome, order };
}

// ── Staff status changes ──────────────────────────────────────────────

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['cancelled'],
  paid: ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  needs_attention: ['processing', 'cancelled', 'refunded'],
  cancelled: [],
  refunded: [],
};

const NOTIFY: Partial<Record<OrderStatus, (o: Order) => { title: string; body: string }>> = {
  processing: (o) => ({ title: `Your order is being prepared — ${o.orderNumber}`, body: 'Our makers have started on your order.' }),
  shipped: (o) => ({ title: `Your order has shipped — ${o.orderNumber}`, body: 'Your order is on its way to you.' }),
  delivered: (o) => ({ title: `Delivered — ${o.orderNumber}`, body: 'Your order has been delivered. Scan the QR code in the packaging to add it to your closet.' }),
  cancelled: (o) => ({ title: `Order cancelled — ${o.orderNumber}`, body: 'Your order was cancelled. Contact support if you have any questions.' }),
  refunded: (o) => ({ title: `Order refunded — ${o.orderNumber}`, body: 'Your order has been marked as refunded.' }),
};

export async function updateStatus(id: string, next: OrderStatus, note?: string): Promise<Order> {
  const ref = orders.doc(id);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw notFound('Order not found');
    const order = snapToObject<Order>(snap);
    if (!TRANSITIONS[order.status].includes(next)) {
      throw conflict(`An order cannot move from "${order.status}" to "${next}"`, 'INVALID_TRANSITION', { allowed: TRANSITIONS[order.status] });
    }

    const restock = (next === 'cancelled' || next === 'refunded') && order.stockDeducted;
    const qty = quantities(order.items);
    const productSnaps = restock ? await tx.getAll(...[...qty.keys()].map((pid) => products.doc(pid))) : [];

    for (const s of productSnaps) {
      if (!s.exists) continue;
      const p = snapToObject<Product>(s);
      const stock = p.stock + (qty.get(s.id) ?? 0);
      tx.update(s.ref, {
        stock,
        status: p.status === 'sold_out' && stock > 0 ? 'active' : p.status,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const patch: Record<string, unknown> = { status: next, updatedAt: FieldValue.serverTimestamp() };
    if (restock) patch.stockDeducted = false;
    if (next === 'refunded') patch.paymentStatus = 'refunded';
    if (note) patch.staffNote = note;
    tx.update(ref, patch);
  });

  const order = await getRaw(id);
  const message = NOTIFY[next]?.(order);
  if (message) await inbox.sendMessage(order.userId, { type: 'order', ...message, link: `/account/orders/${order.id}` });
  return order;
}

// ── Job ───────────────────────────────────────────────────────────────

/** Cancels orders that were never paid within STALE_ORDER_HOURS. */
export async function cancelStale(): Promise<number> {
  const cutoff = Timestamp.fromDate(new Date(Date.now() - env.STALE_ORDER_HOURS * 3600 * 1000));
  const snaps = await orders
    .where('status', '==', 'pending_payment')
    .where('createdAt', '<', cutoff)
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get();
  if (snaps.empty) return 0;
  const batch = db.batch();
  snaps.docs.forEach((d) =>
    batch.update(d.ref, { status: 'cancelled', cancelReason: 'payment_timeout', updatedAt: FieldValue.serverTimestamp() }),
  );
  await batch.commit();
  return snaps.size;
}
