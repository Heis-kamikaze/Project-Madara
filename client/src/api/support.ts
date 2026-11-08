import { api } from '../lib/api'
import type { SupportConversation, SupportMessage } from '../types/api'
import { useApiMutation, useGet, usePaged } from './query'

export const useMyConversations = (enabled = true) =>
  usePaged<SupportConversation>(['support', 'mine'], '/support/conversations/mine', { limit: 20 }, enabled)

/** Polled every 4 seconds while the chat is open. */
export const useConversationMessages = (id: string | undefined) =>
  useGet<SupportMessage[]>(['support', 'messages', id], `/support/conversations/${id}/messages`, { limit: 200 }, {
    enabled: !!id,
    refetchInterval: 4000,
  })

export const useStartConversation = () =>
  useApiMutation(
    (text: string) => api.post<{ conversation: SupportConversation; messages: SupportMessage[] }>('/support/conversations', { text }),
    [['support']],
  )

export const useSendSupportMessage = () =>
  useApiMutation((v: { id: string; text: string }) => api.post<SupportMessage[]>(`/support/conversations/${v.id}/messages`, { text: v.text }), [
    ['support'],
  ])

export const useRequestHuman = () =>
  useApiMutation((id: string) => api.post<SupportMessage>(`/support/conversations/${id}/handoff`), [['support']])

// ── Staff ──
export const useAllConversations = (status?: 'open' | 'resolved') =>
  usePaged<SupportConversation>(['support', 'all'], '/support/conversations', { status, limit: 25 })

export const useUpdateConversation = () =>
  useApiMutation(
    (v: { id: string; patch: { status?: 'open' | 'resolved'; assignedTo?: string | null } }) =>
      api.patch<SupportConversation>(`/support/conversations/${v.id}`, v.patch),
    [['support']],
  )
