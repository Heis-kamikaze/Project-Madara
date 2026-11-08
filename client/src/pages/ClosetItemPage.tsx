import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useClosetItem, useUpdateClosetItem } from '../api/closet'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import StatusBadge from '../components/ui/StatusBadge'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatDate } from '../lib/format'
import type { ClosetItem } from '../types/api'

function NotesForm({ item }: { item: ClosetItem }) {
  const update = useUpdateClosetItem()
  const [notes, setNotes] = useState(item.notes ?? '')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        update.mutate({ id: item.id, patch: { notes: notes.trim() || null } })
      }}
    >
      <label>
        <span>Private notes</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={3} />
      </label>
      <button type="submit" disabled={update.isPending}>
        Save notes
      </button>
      <ErrorMessage error={update.error} />
    </form>
  )
}

export default function ClosetItemPage() {
  const { id } = useParams()
  const { data: item, isLoading, error } = useClosetItem(id)
  usePageTitle(item?.title ?? 'Closet')
  const update = useUpdateClosetItem()

  if (isLoading) return <Loading />
  if (error || !item) return <ErrorMessage error={error ?? new Error('Item not found')} />

  return (
    <article>
      <p>
        <Link to="/closet">← My closet</Link>
      </p>
      <h1>{item.title}</h1>
      <p>
        <StatusBadge status={item.status} /> · {item.source === 'custom' ? 'Custom piece' : 'Collection piece'} · added {formatDate(item.addedAt)}
      </p>
      <div>
        {item.imageUrls.map((url) => (
          <img key={url} src={url} alt={item.title} />
        ))}
      </div>
      {item.story ? <p>{item.story}</p> : null}

      {item.authenticated ? (
        <p>✔ Authenticated</p>
      ) : item.authenticityCode ? (
        <p>
          Not authenticated yet. <Link to={`/verify/${item.authenticityCode}`}>Scan or enter the code on your packaging</Link> to verify it.
        </p>
      ) : null}

      <button type="button" disabled={update.isPending} onClick={() => update.mutate({ id: item.id, patch: { isFavorite: !item.isFavorite } })}>
        {item.isFavorite ? 'Remove from favourites' : 'Add to favourites'}
      </button>
      <ErrorMessage error={update.error} />
      <NotesForm key={item.updatedAt} item={item} />
    </article>
  )
}
