import { db } from '../../config/firebase';
import { snapToObject } from '../../lib/firestore';

export interface MapRegion {
  country: string;
  state: string | null;
  count: number;
}

let cache: { at: number; value: { regions: MapRegion[]; total: number } } | null = null;
const TTL_MS = 60_000;

/**
 * Aggregated, anonymous reach of the brand: how many authenticated pieces exist per country/state.
 * No user ids, addresses, coordinates or timestamps are ever stored or returned.
 */
export async function getRegions(): Promise<{ regions: MapRegion[]; total: number }> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  const snaps = await db.collection('mapRegions').get();
  const regions = snaps.docs
    .map((d) => snapToObject<MapRegion>(d))
    .map((r) => ({ country: r.country, state: r.state ?? null, count: r.count }))
    .sort((a, b) => b.count - a.count);
  const value = { regions, total: regions.reduce((sum, r) => sum + r.count, 0) };
  cache = { at: Date.now(), value };
  return value;
}
