import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { FieldValue, db } from '../../config/firebase';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors';
import { compareValues, snapToObject, toTimestamp } from '../../lib/firestore';
import { uniqueSlug } from '../../lib/slug';
import type { ArchiveReason, Collection, CollectionStatus, Product } from '../../types/models';

const collections = db.collection('collections');
const products = db.collection('products');

export type Availability = 'upcoming' | 'live' | 'ended';

export function availabilityOf(c: Pick<Collection, 'availableFrom' | 'availableUntil'>, now = new Date()): Availability {
  if (c.availableFrom && new Date(c.availableFrom) > now) return 'upcoming';
  if (c.availableUntil && new Date(c.availableUntil) <= now) return 'ended';
  return 'live';
}

/** A collection accepts orders only while it is active AND inside its availability window. */
export function isOrderable(c: Collection, now = new Date()): boolean {
  return c.status === 'active' && availabilityOf(c, now) === 'live';
}

export type CollectionView = Collection & { availability: Availability; orderable: boolean };

export function withDerived(c: Collection): CollectionView {
  return { ...c, availability: availabilityOf(c), orderable: isOrderable(c) };
}

export interface ListFilters {
  status?: CollectionStatus | 'all';
  releaseFrom?: string;
  releaseTo?: string;
  sort: 'release' | 'created' | 'title';
  order: 'asc' | 'desc';
}

export async function list(filters: ListFilters, staff: boolean): Promise<CollectionView[]> {
  const requested = filters.status ?? 'active';
  let statuses: CollectionStatus[];
  if (requested === 'all') statuses = staff ? ['draft', 'active', 'archived'] : ['active', 'archived'];
  else if (requested === 'draft') {
    if (!staff) throw forbidden('Draft collections are only visible to staff');
    statuses = ['draft'];
  } else statuses = [requested];

  const snaps = await collections.where('status', 'in', statuses).get();
  let items = snaps.docs.map((d) => snapToObject<Collection>(d));

  const sortKey = (c: Collection) => c.availableFrom ?? c.createdAt;
  if (filters.releaseFrom) {
    const from = new Date(filters.releaseFrom).getTime();
    items = items.filter((c) => new Date(sortKey(c)).getTime() >= from);
  }
  if (filters.releaseTo) {
    const to = new Date(filters.releaseTo).getTime();
    items = items.filter((c) => new Date(sortKey(c)).getTime() <= to);
  }

  const dir = filters.order === 'asc' ? 1 : -1;
  items.sort((a, b) => {
    if (filters.sort === 'title') return dir * a.title.localeCompare(b.title);
    if (filters.sort === 'created') return dir * compareValues(a.createdAt, b.createdAt);
    return dir * compareValues(sortKey(a), sortKey(b));
  });
  return items.map(withDerived);
}

export async function getRaw(idOrSlug: string): Promise<Collection> {
  let snap: DocumentSnapshot | undefined = await collections.doc(idOrSlug).get();
  if (!snap.exists) {
    const bySlug = await collections.where('slug', '==', idOrSlug).limit(1).get();
    snap = bySlug.docs[0];
  }
  if (!snap || !snap.exists) throw notFound('Collection not found');
  return snapToObject<Collection>(snap);
}

/** Collection plus its pieces. Drafts (and draft pieces) are hidden from the public. */
export async function getWithPieces(idOrSlug: string, staff: boolean): Promise<{ collection: CollectionView; pieces: Product[] }> {
  const c = await getRaw(idOrSlug);
  if (c.status === 'draft' && !staff) throw notFound('Collection not found');
  const snaps = await products.where('collectionId', '==', c.id).get();
  const pieces = snaps.docs
    .map((d) => snapToObject<Product>(d))
    .filter((p) => staff || p.status !== 'draft')
    .sort((a, b) => compareValues(a.releaseAt ?? a.createdAt, b.releaseAt ?? b.createdAt));
  return { collection: withDerived(c), pieces };
}

export interface CollectionInput {
  title: string;
  slug?: string;
  story: string;
  coverImageUrl: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
}

export async function create(input: CollectionInput, actorUid: string): Promise<CollectionView> {
  const slug = await uniqueSlug(collections, input.slug ?? input.title);
  const ref = await collections.add({
    slug,
    title: input.title,
    story: input.story,
    coverImageUrl: input.coverImageUrl,
    status: 'draft',
    availableFrom: toTimestamp(input.availableFrom),
    availableUntil: toTimestamp(input.availableUntil),
    archivedAt: null,
    archiveReason: null,
    createdBy: actorUid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return withDerived(snapToObject<Collection>(await ref.get()));
}

export async function update(id: string, patch: Partial<CollectionInput>): Promise<CollectionView> {
  const ref = collections.doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Collection not found');
  const current = snapToObject<Collection>(snap);

  const next: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (patch.title !== undefined) next.title = patch.title;
  if (patch.story !== undefined) next.story = patch.story;
  if (patch.coverImageUrl !== undefined) next.coverImageUrl = patch.coverImageUrl;
  if (patch.slug !== undefined) next.slug = await uniqueSlug(collections, patch.slug, id);
  if (patch.availableFrom !== undefined) next.availableFrom = toTimestamp(patch.availableFrom);
  if (patch.availableUntil !== undefined) next.availableUntil = toTimestamp(patch.availableUntil);

  const from = patch.availableFrom !== undefined ? patch.availableFrom : current.availableFrom;
  const until = patch.availableUntil !== undefined ? patch.availableUntil : current.availableUntil;
  if (from && until && new Date(until) <= new Date(from)) throw badRequest('availableUntil must be after availableFrom');

  await ref.update(next);
  return withDerived(snapToObject<Collection>(await ref.get()));
}

export async function publish(id: string): Promise<CollectionView> {
  const ref = collections.doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Collection not found');
  const c = snapToObject<Collection>(snap);
  if (c.status !== 'draft') throw conflict(`Only draft collections can be published (this one is ${c.status})`, 'INVALID_STATE');
  if (!c.coverImageUrl) throw badRequest('Add cover art before publishing', undefined, 'COVER_REQUIRED');
  await ref.update({ status: 'active', updatedAt: FieldValue.serverTimestamp() });
  return withDerived(snapToObject<Collection>(await ref.get()));
}

/**
 * Moves a collection to the archive. Its live pieces are archived too, so they
 * disappear from normal browsing but remain viewable on the collection's archive page.
 */
export async function archive(id: string, reason: ArchiveReason): Promise<CollectionView> {
  const ref = collections.doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Collection not found');
  const c = snapToObject<Collection>(snap);
  if (c.status === 'archived') return withDerived(c);
  if (c.status === 'draft') throw conflict('Draft collections cannot be archived; delete them instead', 'INVALID_STATE');

  const pieceSnaps = await products.where('collectionId', '==', id).get();
  const live = pieceSnaps.docs.filter((d) => d.data().status === 'active');
  for (let i = 0; i < live.length; i += 400) {
    const batch = db.batch();
    live.slice(i, i + 400).forEach((d) => batch.update(d.ref, { status: 'archived', updatedAt: FieldValue.serverTimestamp() }));
    await batch.commit();
  }

  await ref.update({
    status: 'archived',
    archivedAt: FieldValue.serverTimestamp(),
    archiveReason: reason,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return withDerived(snapToObject<Collection>(await ref.get()));
}

/** Called after payments: archives the collection once every non-draft piece is gone. */
export async function archiveIfSoldOut(collectionId: string): Promise<boolean> {
  const snap = await collections.doc(collectionId).get();
  if (!snap.exists || snap.data()?.status !== 'active') return false;
  const pieces = await products.where('collectionId', '==', collectionId).get();
  const statuses = pieces.docs.map((d) => d.data().status as string).filter((s) => s !== 'draft');
  if (statuses.length === 0) return false;
  if (statuses.every((s) => s === 'sold_out' || s === 'archived')) {
    await archive(collectionId, 'sold_out');
    return true;
  }
  return false;
}

/** Job: archives active collections whose availability window has closed. */
export async function archiveExpired(): Promise<string[]> {
  const snaps = await collections.where('status', '==', 'active').get();
  const now = new Date();
  const archived: string[] = [];
  for (const d of snaps.docs) {
    const c = snapToObject<Collection>(d);
    if (c.availableUntil && new Date(c.availableUntil) <= now) {
      await archive(c.id, 'expired');
      archived.push(c.id);
    }
  }
  return archived;
}

export async function remove(id: string): Promise<void> {
  const ref = collections.doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Collection not found');
  if (snap.data()?.status !== 'draft') throw conflict('Only draft collections can be deleted. Archive it instead.', 'INVALID_STATE');
  const pieces = await products.where('collectionId', '==', id).limit(1).get();
  if (!pieces.empty) throw conflict('Remove or move this collection\'s pieces first', 'COLLECTION_NOT_EMPTY');
  await ref.delete();
}
