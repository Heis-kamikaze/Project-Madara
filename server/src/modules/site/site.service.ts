import { FieldValue, db } from '../../config/firebase';
import { snapToObject } from '../../lib/firestore';

const doc = db.collection('siteConfig').doc('landing');

/** Items for the central "donut" navigation button. Order is the display order. */
export const NAVIGATION = [
  { key: 'account', label: 'Account', path: '/account' },
  { key: 'collections', label: 'Collections', path: '/collections' },
  { key: 'collaborations', label: 'Collaborations', path: '/collaborations' },
  { key: 'museum', label: 'Museum', path: '/museum' },
  { key: 'community', label: 'Community', path: '/community' },
  { key: 'team', label: 'Team', path: '/team' },
] as const;

export interface LandingConfig {
  heroVideoUrl: string | null;
  heroPosterUrl: string | null;
  headline: string;
  subheadline: string | null;
  featuredCollectionId: string | null;
  updatedAt?: string;
}

const DEFAULTS: LandingConfig = {
  heroVideoUrl: null,
  heroPosterUrl: null,
  headline: 'Aradam',
  subheadline: null,
  featuredCollectionId: null,
};

export async function getLanding(): Promise<LandingConfig & { navigation: typeof NAVIGATION }> {
  const snap = await doc.get();
  const stored = snap.exists ? snapToObject<LandingConfig>(snap) : null;
  return { ...DEFAULTS, ...(stored ?? {}), navigation: NAVIGATION };
}

export async function updateLanding(patch: Partial<LandingConfig>): Promise<LandingConfig & { navigation: typeof NAVIGATION }> {
  await doc.set({ ...patch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return getLanding();
}
