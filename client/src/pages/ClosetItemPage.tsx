import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useClosetItem, useUpdateClosetItem } from '../api/closet'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import Media from '../components/ui/Media'
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
      <button type="submit" disabled={update.isPending} className="btn btn-outline btn-sm self-start">
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
    <article className="pt-1 lg:grid lg:grid-cols-2 lg:gap-14 lg:pt-6">
      <div className="space-y-3">
        {item.imageUrls.length > 0 ? item.imageUrls.map((url) => <Media key={url} src={url} seed={item.id} alt={item.title} className="aspect-[4/5] w-full" />) : <Media seed={item.id} className="aspect-[4/5] w-full" />}
      </div>
      <div className="mt-5 lg:mt-0">
        <p className="tag">{item.source === 'custom' ? 'Custom piece' : 'Collection piece'}</p>
        <h1 data-anim="reveal" className="mt-1 font-serif text-[22px] lg:text-[34px]">{item.title}</h1>
        <p className="mt-2 flex items-center gap-2 text-[11px] text-ink-faint">
          <StatusBadge status={item.status} /> added {formatDate(item.addedAt)}
        </p>
        {item.story ? <p className="mt-4 text-[12.5px] leading-relaxed text-ink-soft">{item.story}</p> : null}

        <p className="mt-5 text-[12.5px]">
          {item.authenticated ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-light px-3.5 py-1.5 text-[11px] font-semibold text-espresso">
              <span className="size-1.5 rounded-full bg-espresso" /> Piece Verified
            </span>
          ) : item.authenticityCode ? (
            <>
              Not authenticated yet.{' '}
              <Link to={`/verify/${item.authenticityCode}`} className="underline underline-offset-4">
                Scan or enter the code on your packaging
              </Link>{' '}
              to verify it.
            </>
          ) : null}
        </p>

        <button type="button" disabled={update.isPending} onClick={() => update.mutate({ id: item.id, patch: { isFavorite: !item.isFavorite } })} className="btn btn-outline btn-sm mt-5">
          {item.isFavorite ? 'Remove from favourites' : 'Add to favourites'}
        </button>
        <ErrorMessage error={update.error} />
        <div className="mt-8">
          <NotesForm key={item.updatedAt} item={item} />
        </div>
      </div>
    </article>
  )
}
