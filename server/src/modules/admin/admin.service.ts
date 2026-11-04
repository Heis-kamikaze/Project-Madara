import { AggregateField, db } from '../../config/firebase';
import { ROLE_PERMISSIONS, ROLES } from '../../config/permissions';
import { paginate } from '../../lib/firestore';

const count = async (col: string, field?: string, value?: string) => {
  const base = db.collection(col);
  const q = field ? base.where(field, '==', value as string) : base;
  return (await q.count().get()).data().count;
};

/** Numbers for the admin dashboard home. Every figure is a Firestore aggregation (no documents are downloaded). */
export async function stats() {
  const paid = db.collection('orders').where('paymentStatus', '==', 'paid');
  const [paidAgg, totalOrders, pending, attention, activePieces, soldOutPieces, activeCollections, archivedCollections, requested, confirmed, openChats, customers] =
    await Promise.all([
      paid.aggregate({ orders: AggregateField.count(), revenueNgn: AggregateField.sum('totalNgn') }).get(),
      count('orders'),
      count('orders', 'status', 'pending_payment'),
      count('orders', 'status', 'needs_attention'),
      count('products', 'status', 'active'),
      count('products', 'status', 'sold_out'),
      count('collections', 'status', 'active'),
      count('collections', 'status', 'archived'),
      count('consultations', 'status', 'requested'),
      count('consultations', 'status', 'confirmed'),
      count('supportConversations', 'status', 'open'),
      count('users', 'role', 'customer'),
    ]);

  const p = paidAgg.data();
  return {
    orders: { total: totalOrders, paid: p.orders, pendingPayment: pending, needsAttention: attention, revenueNgn: p.revenueNgn ?? 0 },
    pieces: { active: activePieces, soldOut: soldOutPieces },
    collections: { active: activeCollections, archived: archivedCollections },
    consultations: { requested, confirmed },
    support: { openConversations: openChats },
    customers,
  };
}

export function roleMatrix() {
  return ROLES.map((role) => ({ role, permissions: ROLE_PERMISSIONS[role] }));
}

export function auditLogs(limit: number, cursor?: string) {
  const logs = db.collection('auditLogs');
  return paginate<Record<string, unknown>>(logs.orderBy('createdAt', 'desc'), logs, limit, cursor);
}
