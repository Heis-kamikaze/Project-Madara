/**
 * Attached to every route as `handle`. The Topbar reads the deepest matching handle to decide
 * what to show: the page title, and whether this is a main page or a sub-page.
 */
export interface PageHandle {
  /** Shown in the topbar. */
  title: string
  /** `main` (default): menu + search. `sub`: back arrow + sub-page title. */
  kind?: 'main' | 'sub'
  /** Where the back arrow goes when there is no in-app history (e.g. the page was opened from a link). */
  back?: string
  /** The landing page shows the wordmark as its title. */
  home?: boolean
}
