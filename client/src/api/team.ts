import { api } from '../lib/api'
import type { TeamMember, TeamNode } from '../types/api'
import { useApiMutation, useGet } from './query'

export const useTeam = () => useGet<{ members: TeamMember[]; tree: TeamNode[] }>(['team'], '/team')

export type TeamInput = {
  name: string
  title: string
  bio: string | null
  portraitUrl: string | null
  parentId: string | null
  order: number
}

export const useCreateTeamMember = () => useApiMutation((body: TeamInput) => api.post<TeamMember>('/team', body), [['team']])
export const useUpdateTeamMember = () =>
  useApiMutation((v: { id: string; patch: Partial<TeamInput> }) => api.patch<TeamMember>(`/team/${v.id}`, v.patch), [['team']])
export const useDeleteTeamMember = () => useApiMutation((id: string) => api.del<{ deleted: boolean }>(`/team/${id}`), [['team']])
