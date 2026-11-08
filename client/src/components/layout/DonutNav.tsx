import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useLanding } from '../../api/site'
import { useUnreadCount } from '../../api/inbox'
import { useAuth } from '../../auth/useAuth'
import { useCart } from '../../cart/useCart'
import { FALLBACK_NAV } from './navigation'

/**
 * The single central navigation control. The button is the "donut"; the list it opens is
 * built from GET /site/landing (navigation) plus the signed-in extras. Style freely.
 */
export default function DonutNav() {
  const [open, setOpen] = useState(false)
  const { status, isStaff, signOut } = useAuth()
  const signedIn = status === 'signedIn'
  const { data: landing } = useLanding()
  const { data: unread } = useUnreadCount(signedIn)
  const { count } = useCart()

  const items = (landing?.navigation ?? FALLBACK_NAV).map((item) =>
    item.key === 'account' && !signedIn ? { ...item, label: 'Sign in', path: '/login' } : item,
  )

  return (
    <div>
      <button type="button" aria-label="Menu" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen((o) => !o)}>
        {/* the donut — draw it with CSS */}
      </button>
      {open ? (
        // Any click inside the menu (a link or a button) closes it.
        <nav id="site-menu" aria-label="Main" onClick={() => setOpen(false)}>
          <ul>
            {items.map((item) => (
              <li key={item.key}>
                <NavLink to={item.path}>{item.label}</NavLink>
              </li>
            ))}
            <li>
              <NavLink to="/pieces">Pieces</NavLink>
            </li>
            <li>
              <NavLink to="/cart">Cart{count > 0 ? ` (${count})` : ''}</NavLink>
            </li>
            {signedIn ? (
              <>
                <li>
                  <NavLink to="/closet">My closet</NavLink>
                </li>
                <li>
                  <NavLink to="/account/inbox">Inbox{unread && unread.unread > 0 ? ` (${unread.unread})` : ''}</NavLink>
                </li>
              </>
            ) : null}
            <li>
              <NavLink to="/support">Help</NavLink>
            </li>
            {isStaff ? (
              <li>
                <NavLink to="/admin">Admin</NavLink>
              </li>
            ) : null}
            {signedIn ? (
              <li>
                <button type="button" onClick={() => void signOut()}>
                  Sign out
                </button>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </div>
  )
}
