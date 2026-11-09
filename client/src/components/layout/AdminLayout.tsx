import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import type { Permission } from '../../types/api'

const LINKS: { to: string; label: string; permission: Permission | null; end?: boolean }[] = [
  { to: '/admin', label: 'Overview', permission: null, end: true },
  { to: '/admin/collections', label: 'Collections', permission: 'collections:write' },
  { to: '/admin/pieces', label: 'Pieces', permission: 'products:write' },
  { to: '/admin/orders', label: 'Orders', permission: 'orders:read' },
  { to: '/admin/consultations', label: 'Consultations', permission: 'consultations:read' },
  { to: '/admin/custom-pieces', label: 'Custom pieces', permission: 'closet:manage' },
  { to: '/admin/authenticity', label: 'QR codes', permission: 'authenticity:manage' },
  { to: '/admin/messages', label: 'Message a customer', permission: 'inbox:send' },
  { to: '/admin/support', label: 'Support chats', permission: 'support:read' },
  { to: '/admin/museum', label: 'Museum', permission: 'museum:write' },
  { to: '/admin/community', label: 'Community', permission: 'community:write' },
  { to: '/admin/team', label: 'Team', permission: 'team:write' },
  { to: '/admin/site', label: 'Landing page', permission: 'site:write' },
  { to: '/admin/users', label: 'People & roles', permission: 'users:read' },
  { to: '/admin/audit', label: 'Audit log', permission: 'audit:read' },
]

/** Staff tools live inside the same site; each link appears only if the role holds the permission. */
export default function AdminLayout() {
  const { can, me } = useAuth()
  return (
    <div className="lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-12">
      <aside className="mb-8 lg:sticky lg:top-24 lg:mb-0 lg:self-start">
        <p className="eyebrow mb-3">Atelier admin · {me?.role}</p>
        <nav aria-label="Admin">
          <ul className="no-scrollbar -mx-[18px] flex gap-2 overflow-x-auto px-[18px] lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0">
            {LINKS.filter((l) => l.permission === null || can(l.permission)).map((l) => (
              <li key={l.to} className="flex-none">
                <NavLink
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `block whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11.5px] transition-colors lg:rounded-md lg:border-0 lg:px-3 lg:py-2 ${
                      isActive ? 'border-ink bg-ink text-bg lg:bg-bg-alt lg:font-semibold lg:text-ink' : 'border-line text-ink-soft hover:text-ink lg:hover:bg-bg-alt'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <section className="min-w-0 [&_h1]:mb-5 [&_h1]:text-[26px] [&_h1]:leading-tight [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-[19px] [&_h3]:text-[15px] [&_p]:my-2 [&_ul]:space-y-2 [&_li>details]:rounded-md [&_li>details]:border [&_li>details]:border-line [&_li>details]:bg-white/50 [&_li>details]:p-3">
        <Outlet />
      </section>
    </div>
  )
}
