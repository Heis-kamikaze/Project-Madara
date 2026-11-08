import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Loading from '../components/ui/Loading'
import ForbiddenPage from '../pages/ForbiddenPage'
import type { Permission } from '../types/api'
import { useAuth } from './useAuth'

/** Redirects to /login (remembering where the user was heading) when signed out. */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <Loading />
  if (status === 'signedOut') {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  return <Outlet />
}

/** Signed-in staff only (any role other than customer). */
export function RequireStaff() {
  const { status, isStaff, me } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <Loading />
  if (status === 'signedOut') {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  if (!me) return <Loading label="Checking your access…" />
  return isStaff ? <Outlet /> : <ForbiddenPage />
}

/** Renders the nested routes only when the role holds the permission; the server enforces it again. */
export function RequirePermission({ permission }: { permission: Permission }) {
  const { can } = useAuth()
  return can(permission) ? <Outlet /> : <ForbiddenPage />
}
