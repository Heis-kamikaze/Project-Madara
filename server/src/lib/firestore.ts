import {
  type CollectionReference,
  type DocumentData,
  type DocumentSnapshot,
  type Query,
  Timestamp,
} from 'firebase-admin/firestore';

/** Recursively converts Firestore Timestamps to ISO-8601 strings. */
export function serialize<T>(value: T): T {
  if (value instanceof Timestamp) return value.toDate().toISOString() as unknown as T;
  if (Array.isArray(value)) return value.map((v) => serialize(v)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = serialize(v);
    return out as T;
  }
  return value;
}

/** Existing snapshot → `{ id, ...fields }` with ISO date strings. */
export function snapToObject<T = Record<string, unknown>>(snap: DocumentSnapshot): T & { id: string } {
  return { id: snap.id, ...serialize((snap.data() ?? {}) as DocumentData) } as T & { id: string };
}

export function toTimestamp(iso: string | null | undefined): Timestamp | null {
  return iso ? Timestamp.fromDate(new Date(iso)) : null;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Cursor pagination. The query MUST already include an orderBy so that
 * `startAfter(snapshot)` is well defined.
 */
export async function paginate<T>(
  query: Query,
  collection: CollectionReference,
  limit: number,
  cursor?: string,
): Promise<Page<T & { id: string }>> {
  let q = query;
  if (cursor) {
    const cursorSnap = await collection.doc(cursor).get();
    if (cursorSnap.exists) q = q.startAfter(cursorSnap);
  }
  const snaps = await q.limit(limit + 1).get();
  const docs = snaps.docs.slice(0, limit);
  return {
    items: docs.map((d) => snapToObject<T>(d)),
    nextCursor: snaps.docs.length > limit ? docs[docs.length - 1].id : null,
  };
}

/** Compares ISO strings / numbers / nulls for in-memory sorting. */
export function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  return (a as string | number) < (b as string | number) ? -1 : 1;
}
