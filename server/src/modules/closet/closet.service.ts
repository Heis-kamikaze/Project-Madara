import { FieldValue, db } from '../../config/firebase';
import { badRequest, notFound } from '../../lib/errors';
import { snapToObject } from '../../lib/firestore';
import type { AuthenticityCode, ClosetItem, ClosetStatus, Consultation } from '../../types/models';
import * as authenticity from '../authenticity/authenticity.service';
import * as inbox from '../inbox/inbox.service';

const closetOf = (uid: string) => db.collection('users').doc(uid).collection('closet');

export async function list(uid: string): Promise<ClosetItem[]> {
  const snaps = await closetOf(uid).orderBy('addedAt', 'desc').limit(200).get();
  return snaps.docs.map((d) => snapToObject<ClosetItem>(d));
}

export async function get(uid: string, id: string): Promise<ClosetItem> {
  const snap = await closetOf(uid).doc(id).get();
  if (!snap.exists) throw notFound('Closet item not found');
  return snapToObject<ClosetItem>(snap);
}

/** Owner customisation of the visual wardrobe (placement, favourites, private notes). */
export async function updateOwn(
  uid: string,
  id: string,
  patch: { isFavorite?: boolean; position?: { x: number; y: number } | null; notes?: string | null },
): Promise<ClosetItem> {
  await get(uid, id);
  await closetOf(uid).doc(id).update({ ...patch, updatedAt: FieldValue.serverTimestamp() });
  return get(uid, id);
}

export interface CustomPieceInput {
  userId: string;
  consultationId?: string;
  title: string;
  story?: string;
  imageUrls: string[];
  status: 'in_production' | 'ready';
  notes?: string;
}

/**
 * Staff: after a custom piece is commissioned, put it straight into the customer's private
 * closet and issue a QR code for its packaging. The code is reserved for that customer.
 */
export async function createCustomPiece(input: CustomPieceInput): Promise<{ item: ClosetItem; code: AuthenticityCode }> {
  const userSnap = await db.collection('users').doc(input.userId).get();
  if (!userSnap.exists) throw notFound('Customer not found');

  if (input.consultationId) {
    const c = await db.collection('consultations').doc(input.consultationId).get();
    if (!c.exists) throw notFound('Consultation not found');
    const consultation = snapToObject<Consultation>(c);
    if (consultation.userId !== input.userId) throw badRequest('That consultation belongs to a different customer', undefined, 'CONSULTATION_MISMATCH');
  }

  const itemRef = closetOf(input.userId).doc();
  const code = await authenticity.createCode({
    closetItemId: itemRef.id,
    ownerUid: input.userId,
    title: input.title,
    imageUrl: input.imageUrls[0] ?? null,
    story: input.story ?? null,
  });

  await itemRef.set({
    source: 'custom',
    title: input.title,
    story: input.story ?? null,
    imageUrls: input.imageUrls,
    productId: null,
    consultationId: input.consultationId ?? null,
    authenticityCode: code.code,
    authenticated: false,
    status: input.status,
    isFavorite: false,
    position: null,
    notes: input.notes ?? null,
    addedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await inbox.sendMessage(input.userId, {
    type: 'production',
    title: `"${input.title}" has been added to your closet`,
    body: input.status === 'ready' ? 'Your custom piece is ready.' : 'Your custom piece is now in production. We will keep you posted here.',
    link: `/closet/${itemRef.id}`,
  });

  return { item: await get(input.userId, itemRef.id), code };
}

/** Staff: move a custom piece through production → ready → delivered and tell the customer. */
export async function setItemStatus(uid: string, id: string, status: ClosetStatus): Promise<ClosetItem> {
  const item = await get(uid, id);
  await closetOf(uid).doc(id).update({ status, updatedAt: FieldValue.serverTimestamp() });

  const messages: Partial<Record<ClosetStatus, { title: string; body: string }>> = {
    in_production: { title: `"${item.title}" is in production`, body: 'Our makers are working on your piece.' },
    ready: { title: `"${item.title}" is ready`, body: 'Your piece is ready. We will be in touch about collection or delivery.' },
    delivered: { title: `"${item.title}" has been delivered`, body: 'Scan the QR code in the packaging to authenticate it and add it to your world map.' },
  };
  const m = messages[status];
  if (m && item.status !== status) await inbox.sendMessage(uid, { type: 'production', ...m, link: `/closet/${id}` });
  return get(uid, id);
}
