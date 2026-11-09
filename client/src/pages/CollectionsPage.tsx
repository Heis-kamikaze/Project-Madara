import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCollections, type CollectionFilters } from '../api/collections'
import CollectionCard from '../components/ui/CollectionCard'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import { usePageTitle } from '../hooks/usePageTitle'

type SortKey = 'newest' | 'oldest' | 'az'
const SORTS: Record<SortKey, Pick<CollectionFilters, 'sort' | 'order'>> = {
  newest: { sort: 'release', order: 'desc' },
  oldest: { sort: 'release', order: 'asc' },
  az: { sort: 'title', order: 'asc' },
}

export default function CollectionsPage() {
  usePageTitle('Collections')
  const [params, setParams] = useSearchParams()
  const archived = params.get('view') === 'archive'
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data, isLoading, error } = useCollections({
    status: archived ? 'archived' : 'active',
    ...SORTS[sortKey],
    releaseFrom: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    releaseTo: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
  })

  const tab = (isArchive: boolean, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={archived === isArchive}
      onClick={() => setParams(isArchive ? { view: 'archive' } : {})}
      className={`rounded-full border px-4 py-1.5 text-[11px] font-semibold tracking-[0.06em] transition-colors ${archived === isArchive ? 'border-ink bg-ink text-bg' : 'border-line text-ink-soft hover:bg-bg-alt'}`}
    >
      {label}
    </button>
  )

  return (
    <section className="pt-2 lg:pt-6">
      <h1 className="sr-only">{archived ? 'Archive' : 'Collections'}</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Collections view" className="flex gap-2">
          {tab(false, 'Current')}
          {tab(true, 'Archive')}
        </div>
        <label className="!flex items-center gap-2">
          <span className="!mb-0 whitespace-nowrap">Sort</span>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="!w-auto !rounded-full !py-2 !pr-8">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="az">A–Z</option>
          </select>
        </label>
      </div>

      <details className="mt-3 text-[12px] text-ink-soft">
        <summary className="inline-block">Filter by release date</summary>
        <div className="mt-3 grid max-w-md grid-cols-2 gap-3">
          <label>
            <span>From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            <span>Until</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
      </details>

      {archived ? <p className="mt-4 max-w-md text-[12px] leading-relaxed text-ink-soft">Collections whose window has closed or that sold out. They can be viewed but not ordered.</p> : null}

      {isLoading ? <Loading /> : null}
      <ErrorMessage error={error} />
      {data && data.length === 0 ? <p className="mt-8 text-[13px] text-ink-faint">{archived ? 'The archive is empty.' : 'No collections are open right now.'}</p> : null}
      <ul data-anim="stagger" className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {data?.map((c) => (
          <li key={c.id}>
            <CollectionCard collection={c} />
          </li>
        ))}
      </ul>
    </section>
  )
}
