import type { NavItem } from '../../types/api'

/** Used until GET /site/landing answers (and if it ever fails). Mirrors the server's list. */
export const FALLBACK_NAV: NavItem[] = [
  { key: 'account', label: 'Account', path: '/account' },
  { key: 'collections', label: 'Collections', path: '/collections' },
  { key: 'collaborations', label: 'Collaborations', path: '/collaborations' },
  { key: 'museum', label: 'Museum', path: '/museum' },
  { key: 'community', label: 'Community', path: '/community' },
  { key: 'team', label: 'Team', path: '/team' },
]
