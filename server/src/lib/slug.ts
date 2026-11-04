import type { CollectionReference } from 'firebase-admin/firestore';
import { slugify } from './ids';

/** Returns a slug unique within `collection` (appends -2, -3… on clashes). */
export async function uniqueSlug(collection: CollectionReference, base: string, excludeId?: string): Promise<string> {
  const root = slugify(base);
  for (let i = 0; i < 50; i += 1) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const clash = await collection.where('slug', '==', candidate).limit(2).get();
    if (clash.docs.every((d) => d.id === excludeId)) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}
