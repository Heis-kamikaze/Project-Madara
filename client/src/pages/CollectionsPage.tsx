import { useState } from 'react'
import { useCollections, type CollectionFilters } from '../api/collections'
import CollectionCard from '../components/ui/CollectionCard'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import { usePageTitle } from '../hooks/usePageTitle'

export default function CollectionsPage() {
  usePageTitle('Collections')
  const [view, setView] = useState<'active' | 'archived'>('active')
  const [sort, setSort] = useState<NonNullable<CollectionFilters['sort']>>('release')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data, isLoading, error } = useCollections({
    status: view,
    sort,
    order,
    releaseFrom: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    releaseTo: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
  })

  return (
    <section>
      <h1>{view === 'active' ? 'Collections' : 'Archive'}</h1>

      <div role="tablist" aria-label="Collections view">
        <button type="button" role="tab" aria-selected={view === 'active'} onClick={() => setView('active')}>
          Current
        </button>
        <button type="button" role="tab" aria-selected={view === 'archived'} onClick={() => setView('archived')}>
          Archive
        </button>
      </div>

      <form onSubmit={(e) => e.preventDefault()} aria-label="Filter collections">
        <label>
          <span>Sort by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="release">Release date</option>
            <option value="created">Date added</option>
            <option value="title">Title</option>
          </select>
        </label>
        <label>
          <span>Order</span>
          <select value={order} onChange={(e) => setOrder(e.target.value as typeof order)}>
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </label>
        <label>
          <span>Released from</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          <span>Released until</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </form>

      {isLoading ? <Loading /> : null}
      <ErrorMessage error={error} />
      {data && data.length === 0 ? <p>{view === 'active' ? 'No collections are open right now.' : 'The archive is empty.'}</p> : null}
      <ul>
        {data?.map((c) => (
          <li key={c.id}>
            <CollectionCard collection={c} />
          </li>
        ))}
      </ul>
    </section>
  )
}
