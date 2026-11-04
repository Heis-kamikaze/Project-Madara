import { FieldValue, db } from '../../config/firebase';
import { badRequest, conflict, notFound } from '../../lib/errors';
import { compareValues, snapToObject } from '../../lib/firestore';
import type { MuseumEntry } from '../../types/models';

const museum = db.collection('museum');

export interface MuseumInput {
  title: string;
  story: string;
  imageUrls: string[];
  clientConsent: boolean;
  published: boolean;
  order: number;
}

export async function listPublic(): Promise<MuseumEntry[]> {
  const snaps = await museum.where('published', '==', true).get();
  return snaps.docs
    .map((d) => snapToObject<MuseumEntry>(d))
    .sort((a, b) => compareValues(a.order, b.order) || compareValues(b.createdAt, a.createdAt));
}

export async function listAll(): Promise<MuseumEntry[]> {
  const snaps = await museum.get();
  return snaps.docs.map((d) => snapToObject<MuseumEntry>(d)).sort((a, b) => compareValues(a.order, b.order));
}

export async function get(id: string, staff: boolean): Promise<MuseumEntry> {
  const snap = await museum.doc(id).get();
  if (!snap.exists) throw notFound('Museum entry not found');
  const entry = snapToObject<MuseumEntry>(snap);
  if (!entry.published && !staff) throw notFound('Museum entry not found');
  return entry;
}

/** Entries show real clients' pieces, so publishing requires the client's consent to be recorded. */
function assertPublishable(entry: Pick<MuseumInput, 'published' | 'clientConsent' | 'imageUrls'>) {
  if (entry.published && !entry.clientConsent) {
    throw conflict('Record the client\'s consent (clientConsent: true) before publishing this entry', 'CONSENT_REQUIRED');
  }
  if (entry.published && entry.imageUrls.length === 0) throw badRequest('Add at least one image before publishing', undefined, 'IMAGE_REQUIRED');
}

export async function create(input: MuseumInput): Promise<MuseumEntry> {
  assertPublishable(input);
  const ref = await museum.add({ ...input, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  return snapToObject<MuseumEntry>(await ref.get());
}

export async function update(id: string, patch: Partial<MuseumInput>): Promise<MuseumEntry> {
  const current = await get(id, true);
  assertPublishable({
    published: patch.published ?? current.published,
    clientConsent: patch.clientConsent ?? current.clientConsent,
    imageUrls: patch.imageUrls ?? current.imageUrls,
  });
  await museum.doc(id).update({ ...patch, updatedAt: FieldValue.serverTimestamp() });
  return get(id, true);
}

export async function remove(id: string): Promise<void> {
  await get(id, true);
  await museum.doc(id).delete();
}
