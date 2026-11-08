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
    <div>
      <aside>
        <p>
          Signed in as <strong>{me?.role}</strong>
        </p>
        <nav aria-label="Admin">
          <ul>
            {LINKS.filter((l) => l.permission === null || can(l.permission)).map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.end}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  )
}
