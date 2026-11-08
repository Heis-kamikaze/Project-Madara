import { api } from '../lib/api'
import type { MuseumEntry } from '../types/api'
import { useApiMutation, useGet } from './query'

export const useMuseum = (includeUnpublished = false) =>
  useGet<MuseumEntry[]>(['museum'], '/museum', includeUnpublished ? { all: true } : undefined)

export type MuseumInput = {
  title: string
  story: string
  imageUrls: string[]
  clientConsent: boolean
  published: boolean
  order: number
}

export const useCreateMuseumEntry = () => useApiMutation((body: MuseumInput) => api.post<MuseumEntry>('/museum', body), [['museum']])
export const useUpdateMuseumEntry = () =>
  useApiMutation((v: { id: string; patch: Partial<MuseumInput> }) => api.patch<MuseumEntry>(`/museum/${v.id}`, v.patch), [['museum']])
export const useDeleteMuseumEntry = () => useApiMutation((id: string) => api.del<{ deleted: boolean }>(`/museum/${id}`), [['museum']])
