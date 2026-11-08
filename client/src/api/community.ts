import { api } from '../lib/api'
import type { Post, PostComment, PostType } from '../types/api'
import { useApiMutation, useGet, usePaged } from './query'

export const usePosts = (type?: PostType) => usePaged<Post>(['posts', 'list'], '/community/posts', { type, limit: 20 })

export const usePost = (id: string | undefined) =>
  useGet<Post>(['posts', 'one', id], `/community/posts/${id}`, undefined, { enabled: !!id })

export const useComments = (postId: string | undefined) =>
  useGet<PostComment[]>(['posts', 'comments', postId], `/community/posts/${postId}/comments`, { limit: 200 }, { enabled: !!postId })

export type NewPost = { type: PostType; title: string; body: string; coverImageUrl: string | null }

export const useCreatePost = () => useApiMutation((body: NewPost) => api.post<Post>('/community/posts', body), [['posts']])
export const useDeletePost = () => useApiMutation((id: string) => api.del<{ deleted: boolean }>(`/community/posts/${id}`), [['posts']])
export const useHidePost = () => useApiMutation((id: string) => api.post<Post>(`/community/posts/${id}/hide`), [['posts']])
export const useUnhidePost = () => useApiMutation((id: string) => api.post<Post>(`/community/posts/${id}/unhide`), [['posts']])

export const useAddComment = () =>
  useApiMutation((v: { postId: string; body: string }) => api.post<PostComment>(`/community/posts/${v.postId}/comments`, { body: v.body }), [
    ['posts'],
  ])

export const useDeleteComment = () =>
  useApiMutation((v: { postId: string; commentId: string }) => api.del<{ deleted: boolean }>(`/community/posts/${v.postId}/comments/${v.commentId}`), [
    ['posts'],
  ])
