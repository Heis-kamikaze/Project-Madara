import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useProducts, type ProductFilters } from '../api/products'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import ProductCard from '../components/ui/ProductCard'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { usePageTitle } from '../hooks/usePageTitle'

type SortKey = 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'az'
const SORTS: Record<SortKey, Pick<ProductFilters, 'sort' | 'order'>> = {
  newest: { sort: 'release', order: 'desc' },
  oldest: { sort: 'release', order: 'asc' },
  'price-asc': { sort: 'price', order: 'asc' },
  'price-desc': { sort: 'price', order: 'desc' },
  az: { sort: 'release', order: 'desc' }, // sorted by title below
}

/** "Singles": every piece, price only. The topbar search sends ?q=… here. */
export default function PiecesPage() {
  usePageTitle('Singles')
  const [params] = useSearchParams()
  const q = params.get('q')?.trim() || undefined

  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [archived, setArchived] = useState(false)
  const min = useDebouncedValue(minPrice, 400)
  const max = useDebouncedValue(maxPrice, 400)

  const { data, isLoading, error } = useProducts({
    status: archived ? 'archived' : undefined,
    q,
    minPrice: min ? Number(min) : undefined,
    maxPrice: max ? Number(max) : undefined,
    releasedFrom: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    releasedTo: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
    ...SORTS[sortKey],
  })
  const items = useMemo(() => (sortKey === 'az' ? [...(data ?? [])].sort((a, b) => a.title.localeCompare(b.title)) : (data ?? [])), [data, sortKey])

  return (
    <section className="pt-2 lg:pt-6">
      <h1 className="sr-only">Singles</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="tag">Price · Date · A–Z</p>
        <label className="!flex items-center gap-2">
          <span className="!mb-0">Sort</span>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="!w-auto !rounded-full !py-2 !pr-8">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="az">A–Z</option>
          </select>
        </label>
      </div>

      {q ? (
        <p className="mt-3 text-[12px] text-ink-soft">
          Results for “{q}” ·{' '}
          <Link to="/pieces" className="underline underline-offset-4">
            clear
          </Link>
        </p>
      ) : null}

      <details className="mt-3 text-[12px] text-ink-soft">
        <summary className="inline-block">Filters</summary>
        <div className="mt-3 grid max-w-xl grid-cols-2 gap-3">
          <label>
            <span>Min price ₦</span>
            <input type="number" min={0} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          </label>
          <label>
            <span>Max price ₦</span>
            <input type="number" min={0} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          </label>
          <label>
            <span>Released from</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            <span>Released until</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label className="col-span-2">
            <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
            Show archived pieces
          </label>
        </div>
      </details>

      {isLoading ? <Loading /> : null}
      <ErrorMessage error={error} />
      {data && items.length === 0 ? <p className="mt-8 text-[13px] text-ink-faint">No pieces match.</p> : null}
      <ul data-anim="stagger" className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {items.map((p) => (
          <li key={p.id}>
            <ProductCard slug={p.slug} title={p.title} priceNgn={p.priceNgn} imageUrl={p.imageUrls[0]} status={p.status} />
          </li>
        ))}
      </ul>
    </section>
  )
}
