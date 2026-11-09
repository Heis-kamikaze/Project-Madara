const SWATCHES = ['sw-flame', 'sw-espresso', 'sw-clay', 'sw-linen', 'sw-garden', 'sw-portrait2'] as const

function hash(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Stable placeholder gradient for items that have no photo yet. */
export const swatchFor = (seed: string): string => SWATCHES[hash(seed) % SWATCHES.length]

/** "2h", "3d", "just now" — compact relative time for inbox/feeds. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.floor(days / 7)}w`
  return new Intl.DateTimeFormat('en-NG', { month: 'short', day: 'numeric' }).format(new Date(iso))
}

/** Deterministic daily shuffle so "pieces at random" changes each day but never flickers on re-render. */
export function dailyShuffle<T>(items: T[], seedText = new Date().toDateString()): T[] {
  let seed = hash(seedText) || 1
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
