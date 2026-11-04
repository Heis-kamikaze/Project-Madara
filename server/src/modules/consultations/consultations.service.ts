import { FieldValue, Timestamp, db } from '../../config/firebase';
import { conflict, forbidden, notFound, badRequest } from '../../lib/errors';
import { paginate, snapToObject } from '../../lib/firestore';
import { can } from '../../middleware/authorize';
import type { AuthUser } from '../../types/express';
import type { Consultation, ConsultationStatus, ConsultationType } from '../../types/models';
import * as inbox from '../inbox/inbox.service';

const consultations = db.collection('consultations');
const MAX_OPEN_PER_USER = 5;

export interface CreateConsultationInput {
  type: ConsultationType;
  requestedSlot: string;
  notes?: string;
  measurements?: Record<string, number>;
  referenceImageUrls: string[];
}

export async function create(user: AuthUser, input: CreateConsultationInput): Promise<Consultation> {
  const mine = await consultations.where('userId', '==', user.uid).limit(50).get();
  const open = mine.docs.filter((d) => ['requested', 'confirmed'].includes(d.data().status as string)).length;
  if (open >= MAX_OPEN_PER_USER) {
    throw conflict(`You already have ${MAX_OPEN_PER_USER} open consultations. Please wait for them to be completed or cancel one.`, 'TOO_MANY_OPEN');
  }

  // Requests for colour/design changes become *custom pieces* rather than standard collection purchases.
  const ref = await consultations.add({
    userId: user.uid,
    userEmail: user.email,
    type: input.type,
    isCustom: input.type === 'custom_piece',
    requestedSlot: Timestamp.fromDate(new Date(input.requestedSlot)),
    scheduledAt: null,
    notes: input.notes ?? null,
    measurements: input.measurements ?? null,
    referenceImageUrls: input.referenceImageUrls,
    status: 'requested',
    adminNotes: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await inbox.sendMessage(user.uid, {
    type: 'consultation',
    title: 'Consultation request received',
    body: 'Thank you! Our team will review your request and confirm a time with you here and by email.',
    link: `/account/consultations/${ref.id}`,
  });
  return snapToObject<Consultation>(await ref.get());
}

export async function getRaw(id: string): Promise<Consultation> {
  const snap = await consultations.doc(id).get();
  if (!snap.exists) throw notFound('Consultation not found');
  return snapToObject<Consultation>(snap);
}

export async function getForUser(id: string, user: AuthUser): Promise<Consultation> {
  const c = await getRaw(id);
  if (c.userId !== user.uid && !can(user, 'consultations:read')) throw notFound('Consultation not found');
  return c;
}

export function listMine(uid: string, limit: number, cursor?: string) {
  return paginate<Consultation>(consultations.where('userId', '==', uid).orderBy('createdAt', 'desc'), consultations, limit, cursor);
}

export function listAll(opts: { status?: ConsultationStatus; limit: number; cursor?: string }) {
  const base = opts.status ? consultations.where('status', '==', opts.status) : consultations;
  return paginate<Consultation>(base.orderBy('createdAt', 'desc'), consultations, opts.limit, opts.cursor);
}

export async function cancelOwn(id: string, user: AuthUser): Promise<Consultation> {
  const c = await getRaw(id);
  if (c.userId !== user.uid) throw forbidden('This is not your consultation');
  if (!['requested', 'confirmed'].includes(c.status)) throw conflict(`A ${c.status} consultation cannot be cancelled`, 'INVALID_STATE');
  await consultations.doc(id).update({ status: 'cancelled', updatedAt: FieldValue.serverTimestamp() });
  return getRaw(id);
}

const TRANSITIONS: Record<ConsultationStatus, ConsultationStatus[]> = {
  requested: ['confirmed', 'cancelled'],
  confirmed: ['confirmed', 'completed', 'cancelled'], // 'confirmed' → 'confirmed' = reschedule
  completed: [],
  cancelled: [],
};

export async function staffUpdate(
  id: string,
  patch: { status?: ConsultationStatus; scheduledAt?: string | null; adminNotes?: string | null },
): Promise<Consultation> {
  const current = await getRaw(id);
  const next = patch.status ?? current.status;

  if (patch.status && !TRANSITIONS[current.status].includes(patch.status)) {
    throw conflict(`A consultation cannot move from "${current.status}" to "${patch.status}"`, 'INVALID_TRANSITION');
  }
  const scheduledAt = patch.scheduledAt !== undefined ? patch.scheduledAt : current.scheduledAt;
  if (next === 'confirmed' && !scheduledAt) throw badRequest('Set scheduledAt when confirming a consultation', undefined, 'SCHEDULE_REQUIRED');

  const update: Record<string, unknown> = { status: next, updatedAt: FieldValue.serverTimestamp() };
  if (patch.scheduledAt !== undefined) update.scheduledAt = patch.scheduledAt ? Timestamp.fromDate(new Date(patch.scheduledAt)) : null;
  if (patch.adminNotes !== undefined) update.adminNotes = patch.adminNotes;
  await consultations.doc(id).update(update);

  const after = await getRaw(id);
  const rescheduled = current.status === 'confirmed' && next === 'confirmed' && patch.scheduledAt !== undefined;
  if (next === 'confirmed' && (current.status !== 'confirmed' || rescheduled)) {
    await inbox.sendMessage(after.userId, {
      type: 'consultation',
      title: rescheduled ? 'Your fitting time has changed' : 'Your consultation is confirmed',
      body: `Your ${after.isCustom ? 'custom piece consultation' : 'consultation'} is scheduled for ${new Date(after.scheduledAt!).toUTCString()}.`,
      link: `/account/consultations/${after.id}`,
    });
  } else if (next === 'cancelled' && current.status !== 'cancelled') {
    await inbox.sendMessage(after.userId, {
      type: 'consultation',
      title: 'Your consultation was cancelled',
      body: 'Your consultation has been cancelled. You are welcome to book a new time whenever you like.',
      link: `/account/consultations/${after.id}`,
    });
  } else if (next === 'completed' && current.status !== 'completed') {
    await inbox.sendMessage(after.userId, {
      type: 'consultation',
      title: 'Consultation completed',
      body: 'Thank you for visiting. We will keep you posted on your piece right here.',
      link: `/account/consultations/${after.id}`,
    });
  }
  return after;
}
