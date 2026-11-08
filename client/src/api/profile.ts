import { api } from '../lib/api'
import type { Address, Role, UserProfile } from '../types/api'
import { useApiMutation, usePaged } from './query'

export type ProfilePatch = {
  displayName?: string
  phone?: string | null
  address?: Address | null
  marketingOptIn?: boolean
}

export const useUpdateProfile = () => useApiMutation((patch: ProfilePatch) => api.patch<UserProfile>('/users/me', patch), [])

// ── Staff ──
export const useUsers = (role?: Role) => usePaged<UserProfile>(['users'], '/users', { role, limit: 25 })

export const useSetUserRole = () =>
  useApiMutation((v: { uid: string; role: Role }) => api.patch<UserProfile>(`/users/${v.uid}/role`, { role: v.role }), [['users']])
