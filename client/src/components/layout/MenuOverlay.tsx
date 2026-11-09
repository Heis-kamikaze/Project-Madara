import { Link } from 'react-router-dom'
import { useCloset } from '../../api/closet'
import { useMyConsultations } from '../../api/consultations'
import { useMyOrders } from '../../api/orders'
import { useAuth } from '../../auth/useAuth'
import { useCart } from '../../cart/useCart'
import { useHelp } from '../../help/useHelp'
import { useOverlay } from '../../hooks/useOverlay'
import { IconClose } from '../icons'
import IconButton from '../ui/IconButton'
import { NAV_ENTRIES } from './navItems'

// Eight nodes around the ring, starting at the top and moving clockwise.
const NODES = NAV_ENTRIES.map((entry, i) => {
  const angle = ((-90 + i * 45) * Math.PI) / 180
  return { ...entry, left: 50 + 46 * Math.cos(angle), top: 50 + 46 * Math.sin(angle) }
})

const linkClass = 'text-[12px] text-bg/80 underline-offset-4 hover:underline'

/** The signature radial "donut" menu. Opened by the hamburger button on small screens. */
export default function MenuOverlay({ onClose }: { onClose: () => void }) {
  useOverlay(onClose)
  const { status, me, isStaff, signOut } = useAuth()
  const signedIn = status === 'signedIn'
  const { count } = useCart()
  const { open: openHelp } = useHelp()
  const closet = useCloset(signedIn)
  const consultations = useMyConsultations(signedIn)
  const orders = useMyOrders(signedIn)

  const fittings = consultations.items.filter((c) => c.status === 'requested' || c.status === 'confirmed').length
  const name = me?.profile?.displayName ?? me?.email ?? 'Welcome'

  return (
    <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 overflow-y-auto bg-ink text-bg lg:hidden" data-anim="menu">
      <div className="mx-auto flex min-h-full max-w-[460px] flex-col px-[18px] pb-10 pt-3">
        <div className="flex items-center justify-between rounded-[22px] bg-white/5 px-4 py-3.5">
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold">{signedIn ? name : 'Welcome to the atelier'}</p>
            <p className="text-[9px] uppercase tracking-[0.1em] text-gold-light">
              {signedIn ? (isStaff ? `${me?.role} · team` : 'Member') : 'Sign in to open your closet'}
            </p>
          </div>
          <IconButton label="Close menu" onClick={onClose} tone="dark">
            <IconClose />
          </IconButton>
        </div>

        {/* The ring */}
        <nav aria-label="Atelier" onClick={onClose} className="relative mx-auto my-9 size-[min(78vw,300px)] rounded-full border border-white/20" data-anim="donut">
          {NODES.map((node) => (
            <Link
              key={node.key}
              to={node.to}
              data-anim="node"
              style={{ left: `${node.left}%`, top: `${node.top}%` }}
              className="absolute w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink py-1.5 text-center text-[10px] tracking-[0.05em] text-bg/90 transition-colors hover:text-gold-light"
            >
              {node.label}
            </Link>
          ))}
          <Link
            to="/"
            className="absolute inset-[17%] flex flex-col items-center justify-center rounded-full border border-gold-light/25 bg-[radial-gradient(circle_at_35%_30%,#2a2a22,#100f0b)]"
          >
            <span className="font-serif text-[15px] italic tracking-[0.1em]">ATELIER</span>
            <span className="mt-0.5 text-[8px] tracking-[0.2em] text-gold-light">ENTER</span>
          </Link>
        </nav>
        <p className="text-center font-serif text-[11px] italic text-white/55">Tap any node to navigate the atelier</p>

        {signedIn ? (
          <dl className="mt-7 grid grid-cols-3 rounded-[10px] bg-white/5 px-4 py-3.5 text-center">
            {[
              ['Closet', closet.data?.length ?? 0],
              ['Fitting', fittings],
              ['Orders', orders.items.length],
            ].map(([label, n]) => (
              <div key={label}>
                <dd className="text-[17px] font-semibold">{n}</dd>
                <dt className="!mt-0 text-[8.5px] text-white/50">{label}</dt>
              </div>
            ))}
          </dl>
        ) : (
          <div className="mt-7 flex flex-col gap-3" onClick={onClose}>
            <Link to="/register" className="btn btn-gold btn-block">
              Enter the Atelier
            </Link>
            <Link to="/login" className="btn btn-outline btn-block !border-white/20 !text-bg hover:!bg-white/10">
              Sign in
            </Link>
          </div>
        )}

        <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3" onClick={onClose}>
          <li>
            <Link to="/cart" className={linkClass}>
              Bag{count > 0 ? ` (${count})` : ''}
            </Link>
          </li>
          {signedIn ? (
            <>
              <li>
                <Link to="/account/inbox" className={linkClass}>
                  Inbox
                </Link>
              </li>
              <li>
                <Link to="/account" className={linkClass}>
                  Account
                </Link>
              </li>
            </>
          ) : null}
          <li>
            <Link to="/museum" className={linkClass}>
              Museum
            </Link>
          </li>
          <li>
            <Link to="/team" className={linkClass}>
              Team
            </Link>
          </li>
          <li>
            <Link to="/about" className={linkClass}>
              About
            </Link>
          </li>
          <li>
            <button type="button" className={linkClass} onClick={() => openHelp()}>
              Help
            </button>
          </li>
          {isStaff ? (
            <li>
              <Link to="/admin" className={linkClass}>
                Admin
              </Link>
            </li>
          ) : null}
          {signedIn ? (
            <li>
              <button type="button" className={linkClass} onClick={() => void signOut()}>
                Sign out
              </button>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  )
}
