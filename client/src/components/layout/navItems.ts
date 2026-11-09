export interface NavEntry {
  key: string
  label: string
  to: string
  /** Hidden on laptop widths (lg) and shown from xl up, so the bar never overflows. */
  xlOnly?: boolean
}

/** One list powers both the radial menu (small screens) and the full navbar (large screens). */
export const NAV_ENTRIES: NavEntry[] = [
  { key: 'closet', label: 'Closet', to: '/closet' },
  { key: 'singles', label: 'Singles', to: '/pieces' },
  { key: 'collections', label: 'Collections', to: '/collections' },
  { key: 'collab', label: 'Collab', to: '/collaborations' },
  { key: 'archive', label: 'Archive', to: '/collections?view=archive', xlOnly: true },
  { key: 'custom', label: 'Custom', to: '/account/consultations/new', xlOnly: true },
  { key: 'world', label: 'World', to: '/world' },
  { key: 'journal', label: 'Journal', to: '/community' },
]

/** Is this nav entry the current location? Handles the Collections vs Archive split (same path). */
export function isNavActive(entry: NavEntry, pathname: string, search: string): boolean {
  const archive = search.includes('view=archive')
  if (entry.key === 'archive') return pathname.startsWith('/collections') && archive
  if (entry.key === 'collections') return pathname.startsWith('/collections') && !archive
  if (entry.key === 'closet') return pathname.startsWith('/closet')
  if (entry.key === 'singles') return pathname.startsWith('/pieces')
  if (entry.key === 'custom') return pathname.startsWith('/account/consultations')
  return pathname.startsWith(entry.to)
}
