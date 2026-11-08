import type { AdminStats, AuditLog, RoleMatrixRow } from '../types/api'
import { useGet, usePaged } from './query'

export const useAdminStats = (enabled = true) => useGet<AdminStats>(['admin', 'stats'], '/admin/stats', undefined, { enabled })
export const useRoleMatrix = (enabled = true) => useGet<RoleMatrixRow[]>(['admin', 'roles'], '/admin/roles', undefined, { enabled })
export const useAuditLogs = () => usePaged<AuditLog>(['admin', 'audit'], '/admin/audit-logs', { limit: 50 })
