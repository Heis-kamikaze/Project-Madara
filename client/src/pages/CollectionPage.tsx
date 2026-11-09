import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCollection } from '../api/collections'
import { useProducts } from '../api/products'
import ErrorMessage from '../components/ui/ErrorMessage'
import HelpLink from '../components/ui/HelpLink'
import Loading from '../components/ui/Loading'
import Media from '../components/ui/Media'
import ProductCard from '../components/ui/ProductCard'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatDate } from '../lib/format'

export default function CollectionPage() {
  const { idOrSlug } = useParams()
  const { data, isLoading, error } = useCollection(idOrSlug)
  const collection = data?.collection
  usePageTitle(collection?.title ?? 'Collection')

  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState<'release' | 'price-asc' | 'price-desc'>('release')
  const min = useDebouncedValue(minPrice, 400)
  const max = useDebouncedValue(maxPrice, 400)

  const pieces = useProducts(
    {
      collectionId: collection?.id,
      status: 'all',
      minPrice: min ? Number(min) : undefined,
      maxPrice: max ? Number(max) : undefined,
      sort: sort === 'release' ? 'release' : 'price',
      order: sort === 'price-desc' ? 'desc' : 'asc',
    },
    !!collection,
  )

  if (isLoading) return <Loading />
  if (error || !collection) return <ErrorMessage error={error ?? new Error('Collection not found')} />

  return (
    <article className="pt-1 lg:pt-6">
      <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
        <Media src={collection.coverImageUrl} seed={collection.slug} alt={collection.title} className="h-[220px] w-full sm:h-[320px] lg:h-[560px]" />
        <div className="mt-4 lg:mt-0 lg:self-center">
          <h1 data-anim="reveal" className="font-serif text-[22px] lg:text-[40px] lg:leading-tight">
            {collection.title}
          </h1>
          {collection.story ? <p className="mt-2 max-w-[520px] font-serif text-[12.5px] italic leading-relaxed text-ink-soft lg:text-[15px]">{collection.story}</p> : null}

          {collection.status === 'archived' ? (
            <aside role="note" className="mt-5 rounded-[10px] border border-line bg-white/50 p-4">
              <p className="text-[12px] leading-relaxed text-ink-soft">
                This collection has been archived{collection.archiveReason === 'sold_out' ? ' because every piece sold out' : ''} and can no longer be ordered.
              </p>
              <div className="mt-3">
                <HelpLink about={collection.title} />
              </div>
            </aside>
          ) : collection.availability === 'upcoming' ? (
            <p className="tag mt-4">Opens {formatDate(collection.availableFrom, true)}</p>
          ) : collection.availableUntil ? (
            <p className="tag mt-4">Available until {formatDate(collection.availableUntil, true)}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <p className="tag">{pieces.data?.length ?? 0} {pieces.data?.length === 1 ? 'piece' : 'pieces'} in this drop</p>
        <details className="text-[12px] text-ink-soft">
          <summary>Filter &amp; sort</summary>
          <div className="mt-3 grid min-w-[260px] grid-cols-2 gap-3">
            <label>
              <span>Min ₦</span>
              <input type="number" min={0} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            </label>
            <label>
              <span>Max ₦</span>
              <input type="number" min={0} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </label>
            <label className="col-span-2">
              <span>Sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                <option value="release">Release order</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </label>
          </div>
        </details>
      </div>

      {pieces.isLoading ? <Loading /> : null}
      <ErrorMessage error={pieces.error} />
      {/* A swipeable rail on phones, a grid on larger screens. */}
      <ul data-anim="stagger" className="no-scrollbar -mx-[18px] mt-4 flex snap-x gap-3 overflow-x-auto px-[18px] lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0">
        {pieces.data?.map((p) => (
          <li key={p.id} className="w-[42vw] max-w-[190px] flex-none snap-start lg:w-auto lg:max-w-none">
            <ProductCard slug={p.slug} title={p.title} priceNgn={p.priceNgn} imageUrl={p.imageUrls[0]} status={p.status} />
          </li>
        ))}
      </ul>
      {pieces.data && pieces.data.length === 0 ? <p className="mt-4 text-[13px] text-ink-faint">No pieces match these filters.</p> : null}
    </article>
  )
}
