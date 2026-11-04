import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { FieldValue, db } from '../../config/firebase';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors';
import { compareValues, snapToObject, toTimestamp } from '../../lib/firestore';
import { uniqueSlug } from '../../lib/slug';
import type { Collection, Product, ProductStatus } from '../../types/models';
import { availabilityOf, isOrderable } from '../collections/collections.service';

const products = db.collection('products');
const collections = db.collection('collections');

export interface CollectionSummary {
  id: string;
  title: string;
  slug: string;
  status: Collection['status'];
  availability: ReturnType<typeof availabilityOf>;
}

export type ProductView = Product & { orderable: boolean; collection: CollectionSummary | null };

async function loadCollections(ids: string[]): Promise<Map<string, Collection>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, Collection>();
  if (unique.length === 0) return map;
  const snaps = await db.getAll(...unique.map((id) => collections.doc(id)));
  snaps.forEach((s) => {
    if (s.exists) map.set(s.id, snapToObject<Collection>(s));
  });
  return map;
}

/** Adds `orderable` and a collection summary; hides pieces of draft/missing collections from the public. */
async function decorate(items: Product[], staff: boolean): Promise<ProductView[]> {
  const cols = await loadCollections(items.map((p) => p.collectionId).filter((x): x is string => !!x));
  const out: ProductView[] = [];
  for (const p of items) {
    const c = p.collectionId ? cols.get(p.collectionId) ?? null : null;
    if (!staff && p.collectionId && (!c || c.status === 'draft')) continue;
    out.push({
      ...p,
      orderable: p.status === 'active' && p.stock > 0 && (c ? isOrderable(c) : true),
      collection: c ? { id: c.id, title: c.title, slug: c.slug, status: c.status, availability: availabilityOf(c) } : null,
    });
  }
  return out;
}

export interface ListFilters {
  collectionId?: string;
  status?: ProductStatus | 'all';
  minPrice?: number;
  maxPrice?: number;
  releasedFrom?: string;
  releasedTo?: string;
  q?: string;
  sort: 'price' | 'date' | 'release';
  order: 'asc' | 'desc';
  limit: number;
}

export async function list(filters: ListFilters, staff: boolean): Promise<ProductView[]> {
  const requested = filters.status;
  let statuses: ProductStatus[];
  if (requested === 'draft') {
    if (!staff) throw forbidden('Draft pieces are only visible to staff');
    statuses = ['draft'];
  } else if (requested === 'all') statuses = staff ? ['draft', 'active', 'sold_out', 'archived'] : ['active', 'sold_out', 'archived'];
  else if (requested) statuses = [requested];
  else statuses = ['active', 'sold_out'];

  // Single-field queries only (no composite indexes); filtering/sorting happens in memory.
  const query = filters.collectionId
    ? products.where('collectionId', '==', filters.collectionId)
    : products.where('status', 'in', statuses);
  const snaps = await query.get();

  let items = snaps.docs.map((d) => snapToObject<Product>(d)).filter((p) => statuses.includes(p.status));

  if (filters.minPrice !== undefined) items = items.filter((p) => p.priceNgn >= filters.minPrice!);
  if (filters.maxPrice !== undefined) items = items.filter((p) => p.priceNgn <= filters.maxPrice!);
  const releaseOf = (p: Product) => new Date(p.releaseAt ?? p.createdAt).getTime();
  if (filters.releasedFrom) items = items.filter((p) => releaseOf(p) >= new Date(filters.releasedFrom!).getTime());
  if (filters.releasedTo) items = items.filter((p) => releaseOf(p) <= new Date(filters.releasedTo!).getTime());
  if (filters.q) {
    const needle = filters.q.toLowerCase();
    items = items.filter((p) => `${p.title} ${p.story}`.toLowerCase().includes(needle));
  }

  const dir = filters.order === 'asc' ? 1 : -1;
  items.sort((a, b) => {
    if (filters.sort === 'price') return dir * compareValues(a.priceNgn, b.priceNgn);
    if (filters.sort === 'date') return dir * compareValues(a.createdAt, b.createdAt);
    return dir * compareValues(releaseOf(a), releaseOf(b));
  });

  return decorate(items.slice(0, filters.limit), staff);
}

export async function getRaw(idOrSlug: string): Promise<Product> {
  let snap: DocumentSnapshot | undefined = await products.doc(idOrSlug).get();
  if (!snap.exists) {
    const bySlug = await products.where('slug', '==', idOrSlug).limit(1).get();
    snap = bySlug.docs[0];
  }
  if (!snap || !snap.exists) throw notFound('Piece not found');
  return snapToObject<Product>(snap);
}

export async function get(idOrSlug: string, staff: boolean): Promise<ProductView> {
  const p = await getRaw(idOrSlug);
  if (p.status === 'draft' && !staff) throw notFound('Piece not found');
  const [view] = await decorate([p], staff);
  if (!view) throw notFound('Piece not found');
  return view;
}

export interface ProductInput {
  collectionId: string | null;
  title: string;
  slug?: string;
  story: string;
  priceNgn: number;
  colorName: string;
  colorHex: string | null;
  sizes: string[];
  imageUrls: string[];
  stock: number;
  status: 'draft' | 'active' | 'archived';
  releaseAt: string | null;
}

function normalizeStatus(status: ProductStatus, stock: number): ProductStatus {
  if (status === 'active' && stock === 0) return 'sold_out';
  if (status === 'sold_out' && stock > 0) return 'active';
  return status;
}

async function assertCollectionExists(id: string | null | undefined) {
  if (!id) return;
  const snap = await collections.doc(id).get();
  if (!snap.exists) throw badRequest('collectionId does not match any collection', undefined, 'UNKNOWN_COLLECTION');
}

export async function create(input: ProductInput, actorUid: string): Promise<ProductView> {
  await assertCollectionExists(input.collectionId);
  const slug = await uniqueSlug(products, input.slug ?? input.title);
  const ref = await products.add({
    collectionId: input.collectionId,
    slug,
    title: input.title,
    story: input.story,
    priceNgn: input.priceNgn,
    currency: 'NGN',
    colorName: input.colorName,
    colorHex: input.colorHex,
    sizes: input.sizes,
    imageUrls: input.imageUrls,
    stock: input.stock,
    status: normalizeStatus(input.status, input.stock),
    releaseAt: toTimestamp(input.releaseAt),
    createdBy: actorUid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return get(ref.id, true);
}

export async function update(id: string, patch: Partial<ProductInput>): Promise<ProductView> {
  const ref = products.doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Piece not found');
  const current = snapToObject<Product>(snap);

  if (patch.collectionId !== undefined) await assertCollectionExists(patch.collectionId);

  const next: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  const assign = <K extends keyof ProductInput>(k: K) => {
    if (patch[k] !== undefined) next[k] = patch[k];
  };
  (['collectionId', 'title', 'story', 'priceNgn', 'colorName', 'colorHex', 'sizes', 'imageUrls', 'stock'] as const).forEach(assign);
  if (patch.slug !== undefined) next.slug = await uniqueSlug(products, patch.slug, id);
  if (patch.releaseAt !== undefined) next.releaseAt = toTimestamp(patch.releaseAt);

  const stock = patch.stock ?? current.stock;
  const status = normalizeStatus((patch.status ?? current.status) as ProductStatus, stock);
  next.status = status;

  await ref.update(next);
  return get(id, true);
}

export async function remove(id: string): Promise<void> {
  const ref = products.doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Piece not found');
  if (snap.data()?.status !== 'draft') throw conflict('Only draft pieces can be deleted. Archive it instead.', 'INVALID_STATE');
  await ref.delete();
}
