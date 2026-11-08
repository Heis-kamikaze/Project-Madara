import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCreatePost, useDeletePost, useHidePost, usePosts } from '../../api/community'
import { uploadMedia } from '../../api/media'
import { useAuth } from '../../auth/useAuth'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Field from '../../components/ui/Field'
import ImageUploader from '../../components/ui/ImageUploader'
import LoadMore from '../../components/ui/LoadMore'
import Loading from '../../components/ui/Loading'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate, humanize } from '../../lib/format'

/** Publish news and campaign updates; hide or delete posts that break the house rules. */
export default function AdminCommunityPage() {
  usePageTitle('Community · Admin')
  const { can } = useAuth()
  const create = useCreatePost()
  const posts = usePosts()
  const hide = useHidePost()
  const remove = useDeletePost()
  const [type, setType] = useState<'news' | 'campaign'>('news')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [cover, setCover] = useState<string[]>([])
  const moderate = can('community:moderate')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    await create.mutateAsync({ type, title: title.trim(), body: body.trim(), coverImageUrl: cover[0] ?? null })
    setTitle('')
    setBody('')
    setCover([])
  }

  return (
    <div>
      <h1>Community</h1>
      <form onSubmit={onSubmit}>
        <h2>Publish an update</h2>
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="news">News</option>
            <option value="campaign">Campaign</option>
          </select>
        </Field>
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
        </Field>
        <Field label="Text">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={10000} rows={8} required />
        </Field>
        <ImageUploader label="Cover image (optional)" value={cover} onChange={(urls) => setCover(urls.slice(-1))} upload={(f) => uploadMedia('community', f)} max={1} />
        <button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Publishing…' : 'Publish'}
        </button>
        <ErrorMessage error={create.error} />
      </form>

      <h2>Recent posts</h2>
      {posts.isLoading ? <Loading /> : null}
      <ErrorMessage error={posts.error ?? hide.error ?? remove.error} />
      <ul>
        {posts.items.map((p) => (
          <li key={p.id}>
            <Link to={`/community/${p.id}`}>{p.title}</Link> · {humanize(p.type)} · {p.authorName} · {formatDate(p.publishedAt)}{' '}
            {moderate ? (
              <>
                <button type="button" onClick={() => hide.mutate(p.id)}>
                  Hide
                </button>
                <button type="button" onClick={() => window.confirm(`Delete "${p.title}"?`) && remove.mutate(p.id)}>
                  Delete
                </button>
              </>
            ) : null}
          </li>
        ))}
      </ul>
      <LoadMore hasNextPage={!!posts.hasNextPage} isFetchingNextPage={posts.isFetchingNextPage} onClick={() => void posts.fetchNextPage()} />
    </div>
  )
}
