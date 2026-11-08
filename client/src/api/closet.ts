import { api } from '../lib/api'
import type { AuthenticityCode, ClosetItem } from '../types/api'
import { useApiMutation, useGet } from './query'

export const useCloset = () => useGet<ClosetItem[]>(['closet', 'list'], '/closet')

export const useClosetItem = (id: string | undefined) =>
  useGet<ClosetItem>(['closet', 'one', id], `/closet/${id}`, undefined, { enabled: !!id })

export type ClosetPatch = {
  isFavorite?: boolean
  position?: { x: number; y: number } | null
  notes?: string | null
}

export const useUpdateClosetItem = () =>
  useApiMutation((v: { id: string; patch: ClosetPatch }) => api.patch<ClosetItem>(`/closet/${v.id}`, v.patch), [['closet']])

// ── Staff ──
export type CustomPieceInput = {
  userId: string
  consultationId?: string
  title: string
  story?: string
  imageUrls: string[]
  status: 'in_production' | 'ready'
  notes?: string
}

export const useCreateCustomPiece = () =>
  useApiMutation((body: CustomPieceInput) => api.post<{ item: ClosetItem; code: AuthenticityCode }>('/closet/admin/custom-pieces', body), [
    ['closet'],
  ])

export const useSetClosetItemStatus = () =>
  useApiMutation(
    (v: { uid: string; id: string; status: 'in_production' | 'ready' | 'delivered' }) =>
      api.patch<ClosetItem>(`/closet/admin/${v.uid}/${v.id}/status`, { status: v.status }),
    [['closet']],
  )
