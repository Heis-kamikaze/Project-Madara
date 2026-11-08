import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { api, type Query } from '../lib/api'
import type { ApiEnvelope } from '../types/api'

interface GetOptions {
  enabled?: boolean
  refetchInterval?: number | false
}

/** GET → returns just `data`. */
export function useGet<T>(key: QueryKey, path: string, query?: Query, options: GetOptions = {}) {
  return useQuery({
    queryKey: [...key, query ?? null],
    queryFn: ({ signal }) => api.get<T>(path, query, signal),
    select: (res) => res.data,
    ...options,
  })
}

/** GET → returns `{ data, meta }` (use when you need meta such as totals). */
export function useGetEnvelope<T>(key: QueryKey, path: string, query?: Query, options: GetOptions = {}) {
  return useQuery({
    queryKey: [...key, query ?? null],
    queryFn: ({ signal }) => api.get<T>(path, query, signal),
    ...options,
  })
}

/** Cursor-paginated list. `items` is every page flattened; call `fetchNextPage()` for "Load more". */
export function usePaged<T>(key: QueryKey, path: string, query: Query = {}, enabled = true) {
  const q = useInfiniteQuery({
    queryKey: [...key, query],
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => api.get<T[]>(path, { ...query, cursor: pageParam }, signal),
    getNextPageParam: (last) => (typeof last.meta?.nextCursor === 'string' ? last.meta.nextCursor : undefined),
  })
  return { ...q, items: q.data?.pages.flatMap((page) => page.data) ?? [] }
}

/** Mutation that refreshes the listed query keys on success. */
export function useApiMutation<TInput, TOutput>(
  fn: (input: TInput) => Promise<ApiEnvelope<TOutput>>,
  invalidate: QueryKey[] = [],
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
    },
  })
}
