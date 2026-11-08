import { useState } from 'react'
import { useRoleMatrix } from '../../api/admin'
import { useSetUserRole, useUsers } from '../../api/profile'
import { useAuth } from '../../auth/useAuth'
import ErrorMessage from '../../components/ui/ErrorMessage'
import LoadMore from '../../components/ui/LoadMore'
import Loading from '../../components/ui/Loading'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate, humanize } from '../../lib/format'
import { ROLES, type Role } from '../../types/api'

export default function AdminUsersPage() {
  usePageTitle('People · Admin')
  const { me, can, refresh } = useAuth()
  const [filter, setFilter] = useState<Role | ''>('')
  const users = useUsers(filter || undefined)
  const setRole = useSetUserRole()
  const matrix = useRoleMatrix(can('users:read'))
  const canManage = can('users:manage-roles')
  const isOwner = me?.role === 'owner'

  // Only an owner can grant or revoke owner/admin; the server enforces it too.
  const assignable = (role: Role) => isOwner || (role !== 'owner' && role !== 'admin')

  return (
    <div>
      <h1>People & roles</h1>
      <label>
        <span>Role</span>
        <select value={filter} onChange={(e) => setFilter(e.target.value as Role | '')}>
          <option value="">Everyone</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {humanize(r)}
            </option>
          ))}
        </select>
      </label>

      {users.isLoading ? <Loading /> : null}
      <ErrorMessage error={users.error ?? setRole.error} />
      {setRole.isSuccess ? <p role="status">Role updated. The person must sign out and back in (or reload) for it to take effect.</p> : null}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Joined</th>
            <th>Id</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.items.map((u) => {
            const locked = !canManage || u.id === me?.uid || !assignable(u.role)
            return (
              <tr key={u.id}>
                <td>{u.displayName ?? '—'}</td>
                <td>{u.email ?? '—'}</td>
                <td>{formatDate(u.createdAt)}</td>
                <td>
                  <code>{u.id}</code>
                </td>
                <td>
                  <select
                    aria-label={`Role for ${u.displayName ?? u.email ?? u.id}`}
                    value={u.role}
                    disabled={locked || setRole.isPending}
                    onChange={(e) => {
                      const role = e.target.value as Role
                      if (window.confirm(`Change this person's role to ${role}?`)) {
                        setRole.mutate({ uid: u.id, role }, { onSuccess: () => void refresh() })
                      }
                    }}
                  >
                    {ROLES.filter((r) => r === u.role || assignable(r)).map((r) => (
                      <option key={r} value={r}>
                        {humanize(r)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <LoadMore hasNextPage={!!users.hasNextPage} isFetchingNextPage={users.isFetchingNextPage} onClick={() => void users.fetchNextPage()} />

      <details>
        <summary>What can each role do?</summary>
        <ul>
          {matrix.data?.map((row) => (
            <li key={row.role}>
              <strong>{humanize(row.role)}:</strong> {row.permissions.length > 0 ? row.permissions.join(', ') : 'no staff tools'}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
