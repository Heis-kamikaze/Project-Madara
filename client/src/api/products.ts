import { api } from '../lib/api'
import type { Product, ProductStatus } from '../types/api'
import { useApiMutation, useGet } from './query'

export type ProductFilters = {
  collectionId?: string
  status?: ProductStatus | 'all'
  minPrice?: number
  maxPrice?: number
  releasedFrom?: string
  releasedTo?: string
  q?: string
  sort?: 'price' | 'date' | 'release'
  order?: 'asc' | 'desc'
  limit?: number
}

export const useProducts = (filters: ProductFilters = {}, enabled = true) =>
  useGet<Product[]>(['products'], '/products', filters, { enabled })

export const useProduct = (idOrSlug: string | undefined) =>
  useGet<Product>(['product', idOrSlug], `/products/${idOrSlug}`, undefined, { enabled: !!idOrSlug })

export type ProductInput = {
  collectionId: string | null
  title: string
  slug?: string
  story: string
  priceNgn: number
  colorName: string
  colorHex: string | null
  sizes: string[]
  imageUrls: string[]
  stock: number
  status: 'draft' | 'active' | 'archived'
  releaseAt: string | null
}

const refresh = [['products'], ['product'], ['collection']]

export const useCreateProduct = () => useApiMutation((body: ProductInput) => api.post<Product>('/products', body), refresh)

export const useUpdateProduct = () =>
  useApiMutation((v: { id: string; patch: Partial<ProductInput> }) => api.patch<Product>(`/products/${v.id}`, v.patch), refresh)

export const useDeleteProduct = () =>
  useApiMutation((id: string) => api.del<{ deleted: boolean }>(`/products/${id}`), refresh)
