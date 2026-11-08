import { api } from '../lib/api'
import type { InboxMessage, InboxType } from '../types/api'
import { useApiMutation, useGet, useGetEnvelope } from './query'

export const useInbox = () => useGetEnvelope<InboxMessage[]>(['inbox', 'list'], '/inbox', { limit: 50 })

/** Poll the unread badge once a minute while signed in. */
export const useUnreadCount = (enabled: boolean) =>
  useGet<{ unread: number }>(['inbox', 'unread'], '/inbox/unread-count', undefined, { enabled, refetchInterval: 60_000 })

export const useMarkRead = () => useApiMutation((id: string) => api.patch<{ read: boolean }>(`/inbox/${id}/read`, {}), [['inbox']])
export const useMarkAllRead = () => useApiMutation(() => api.post<{ updated: number }>('/inbox/read-all'), [['inbox']])
export const useDeleteMessage = () => useApiMutation((id: string) => api.del<{ deleted: boolean }>(`/inbox/${id}`), [['inbox']])

export type StaffMessage = {
  userId: string
  type: InboxType
  title: string
  body: string
  link?: string
  mirrorToEmail: boolean
}

export const useSendMessage = () => useApiMutation((body: StaffMessage) => api.post<{ id: string }>('/inbox/send', body))
