import { useState } from 'react'
import { Link, useLocation, useMatches, useNavigate } from 'react-router-dom'
import { useUnreadCount } from '../../api/inbox'
import { useAuth } from '../../auth/useAuth'
import { useCart } from '../../cart/useCart'
import { useHelp } from '../../help/useHelp'
import { IconBack, IconBag, IconMail, IconMenu, IconSearch, IconUser } from '../icons'
import IconButton from '../ui/IconButton'
import MenuOverlay from './MenuOverlay'
import { NAV_ENTRIES, isNavActive } from './navItems'
import type { PageHandle } from './pageMeta'
import SearchBox from './SearchBox'
import SearchOverlay from './SearchOverlay'

const titleClass = 'font-serif text-[13px] uppercase tracking-[0.14em]'

/**
 * The one topbar for the whole app. It reads the current route's `handle` (see pageMeta.ts):
 *
 *  Large screens (lg+)   wordmark · page title · full navbar · search · bag/inbox/account
 *  Small, main page      hamburger (radial menu) · page title · search icon
 *  Small, sub-page       back arrow · sub-page title
 */
export default function Topbar() {
  const matches = useMatches()
  const location = useLocation()
  const navigate = useNavigate()
  const { status } = useAuth()
  const signedIn = status === 'signedIn'
  const { count } = useCart()
  const { open: openHelp } = useHelp()
  const { data: unread } = useUnreadCount(signedIn)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const handle = [...matches]
    .reverse()
    .map((m) => m.handle as PageHandle | undefined)
    .find((h) => h?.title)
  const title = handle?.title ?? ''
  const isSub = handle?.kind === 'sub'
  const isHome = !!handle?.home

  function goBack() {
    // `default` = the first page of this visit, so there is nothing to go back to inside the app.
    if (location.key !== 'default') navigate(-1)
    else navigate(handle?.back ?? '/')
  }

  const unreadCount = unread?.unread ?? 0

  return (
    <>
      <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur-md" data-anim="topbar">
        {/* ── Small screens ───────────────────────────── */}
        <div className="flex h-14 items-center justify-between px-[18px] lg:hidden">
          {isSub ? (
            <IconButton label="Back" onClick={goBack}>
              <IconBack />
            </IconButton>
          ) : (
            <IconButton label="Open menu" expanded={menuOpen} onClick={() => setMenuOpen(true)}>
              <IconMenu />
            </IconButton>
          )}

          <p data-page-title className={isHome ? 'font-serif text-[15px] italic tracking-[0.08em]' : titleClass}>
            {title}
          </p>

          {isSub ? (
            <span className="size-[34px]" aria-hidden="true" />
          ) : (
            <IconButton label="Search" onClick={() => setSearchOpen(true)}>
              <IconSearch />
            </IconButton>
          )}
        </div>

        {/* ── Large screens ───────────────────────────── */}
        <div className="mx-auto hidden h-[76px] max-w-[1280px] items-center gap-5 px-10 lg:flex">
          <Link to="/" className="flex-none font-serif text-lg italic tracking-[0.08em]">
            ARADAM
          </Link>
          {/* {!isHome && title ? (
            <p data-page-title className={`${titleClass} flex flex-none items-center gap-4 text-ink-soft`}>
              <span className="h-4 w-px bg-line" aria-hidden="true" />
              {title}
            </p>
          ) : null} */}

          <nav aria-label="Main" className="flex min-w-0 flex-1 items-center justify-center gap-5 xl:gap-7">
            {NAV_ENTRIES.map((entry) => {
              const active = isNavActive(entry, location.pathname, location.search)
              return (
                <Link
                  key={entry.key}
                  to={entry.to}
                  aria-current={active ? 'page' : undefined}
                  className={`text-[12px] tracking-[0.04em] transition-colors hover:text-gold ${entry.xlOnly ? 'hidden xl:inline' : ''} ${
                    active ? 'font-semibold text-ink underline decoration-gold decoration-2 underline-offset-[10px]' : 'text-ink-soft'
                  }`}
                >
                  {entry.label}
                </Link>
              )
            })}
          </nav>

          <SearchBox floating className="w-44 flex-none xl:w-60" />

          <div className="flex flex-none items-center gap-2">
            <button type="button" onClick={() => openHelp()} className="mr-1 text-[12px] text-ink-soft hover:text-gold">
              Help
            </button>
            <Link to="/cart" aria-label={`Bag${count > 0 ? `, ${count} items` : ''}`} className="relative flex size-[34px] items-center justify-center rounded-full border border-line bg-white/60 hover:bg-bg-alt">
              <IconBag />
              {count > 0 ? <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-ink text-[9px] font-semibold text-bg">{count}</span> : null}
            </Link>
            {signedIn ? (
              <Link to="/account/inbox" aria-label={`Inbox${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`} className="relative flex size-[34px] items-center justify-center rounded-full border border-line bg-white/60 hover:bg-bg-alt">
                <IconMail />
                {unreadCount > 0 ? <span className="absolute right-0.5 top-0.5 size-2 rounded-full bg-gold" /> : null}
              </Link>
            ) : null}
            <Link to={signedIn ? '/account' : '/login'} aria-label={signedIn ? 'Account' : 'Sign in'} className="flex size-[34px] items-center justify-center rounded-full border border-line bg-white/60 hover:bg-bg-alt">
              <IconUser />
            </Link>
          </div>
        </div>
      </header>

      {menuOpen ? <MenuOverlay onClose={() => setMenuOpen(false)} /> : null}
      {searchOpen ? <SearchOverlay onClose={() => setSearchOpen(false)} /> : null}
    </>
  )
}
