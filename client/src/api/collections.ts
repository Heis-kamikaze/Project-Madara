import { api } from '../lib/api'
import type { Collection, CollectionPiece } from '../types/api'
import { useApiMutation, useGet } from './query'

export type CollectionFilters = {
  status?: 'draft' | 'active' | 'archived' | 'all'
  releaseFrom?: string
  releaseTo?: string
  sort?: 'release' | 'created' | 'title'
  order?: 'asc' | 'desc'
}

export const useCollections = (filters: CollectionFilters = {}) =>
  useGet<Collection[]>(['collections'], '/collections', filters)

export const useCollection = (idOrSlug: string | undefined) =>
  useGet<{ collection: Collection; pieces: CollectionPiece[] }>(['collection', idOrSlug], `/collections/${idOrSlug}`, undefined, {
    enabled: !!idOrSlug,
  })

export type CollectionInput = {
  title: string
  slug?: string
  story: string
  coverImageUrl: string | null
  availableFrom: string | null
  availableUntil: string | null
}

const refresh = [['collections'], ['collection'], ['products']]

export const useCreateCollection = () =>
  useApiMutation((body: CollectionInput) => api.post<Collection>('/collections', body), refresh)

export const useUpdateCollection = () =>
  useApiMutation((v: { id: string; patch: Partial<CollectionInput> }) => api.patch<Collection>(`/collections/${v.id}`, v.patch), refresh)

export const usePublishCollection = () =>
  useApiMutation((id: string) => api.post<Collection>(`/collections/${id}/publish`), refresh)

export const useArchiveCollection = () =>
  useApiMutation((id: string) => api.post<Collection>(`/collections/${id}/archive`), refresh)

export const useDeleteCollection = () =>
  useApiMutation((id: string) => api.del<{ deleted: boolean }>(`/collections/${id}`), refresh)
