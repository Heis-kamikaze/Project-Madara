import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../api/collections'
import { useProducts } from '../api/products'
import { useLanding } from '../api/site'
import ErrorMessage from '../components/ui/ErrorMessage'
import ProductCard from '../components/ui/ProductCard'
import { usePageTitle } from '../hooks/usePageTitle'
import { dailyShuffle } from '../lib/swatch'

/** Home & editorial stream: the runway film, then an unordered "shop window" of pieces. */
export default function LandingPage() {
  usePageTitle('')
  const landing = useLanding()
  const featured = useCollection(landing.data?.featuredCollectionId ?? undefined)
  const pieces = useProducts({ limit: 24, sort: 'release', order: 'desc' })
  const stream = useMemo(() => dailyShuffle(pieces.data ?? []).slice(0, 12), [pieces.data])
  const l = landing.data

  return (
    <div className="pt-1 lg:pt-4">
      <section data-anim="hero" className="relative overflow-hidden rounded-md lg:rounded-xl">
        {l?.heroVideoUrl ? (
          <video
            src={l.heroVideoUrl}
            poster={l.heroPosterUrl ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
            className="h-[260px] w-full object-cover sm:h-[360px] lg:h-[560px]"
          />
        ) : (
          <div className="swatch sw-video h-[260px] w-full sm:h-[360px] lg:h-[560px]" aria-hidden="true" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent p-5 text-bg lg:p-10">
          <h1 data-anim="reveal" className="font-serif text-[clamp(28px,5vw,56px)] leading-[1.05]">
            {l?.headline ?? 'Aradam'}
          </h1>
          {l?.subheadline ? (
            <p data-anim="reveal" className="mt-2 max-w-[520px] text-[13px] text-bg/80 lg:text-[15px]">
              {l.subheadline}
            </p>
          ) : null}
        </div>
      </section>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3 lg:mt-5">
        <div>
          <p className="tag">{featured.data?.collection ? featured.data.collection.title : 'Current runway film'}</p>
          <p className="mt-1 font-serif text-[13px] text-ink-soft">The house's rotating shop window</p>
        </div>
        {featured.data?.collection ? (
          <Link to={`/collections/${featured.data.collection.slug}`} className="btn btn-outline btn-sm">
            Explore the collection
          </Link>
        ) : null}
      </div>
      <ErrorMessage error={landing.error} />

      <div className="divider lg:my-10" />
      <p className="mb-3 text-[10px] uppercase tracking-[0.08em] text-ink-faint">As you scroll — pieces, at random</p>
      <ul data-anim="stagger" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {stream.map((p) => (
          <li key={p.id}>
            <ProductCard slug={p.slug} title={p.title} priceNgn={p.priceNgn} imageUrl={p.imageUrls[0]} status={p.status} />
          </li>
        ))}
      </ul>
      {pieces.data && pieces.data.length === 0 ? <p className="text-[13px] text-ink-faint">New pieces are on their way.</p> : null}
      <div className="mt-8 text-center">
        <Link to="/pieces" className="btn btn-outline btn-sm">
          See all singles
        </Link>
      </div>
    </div>
  )
}
