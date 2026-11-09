import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useProduct } from '../api/products'
import { useCart } from '../cart/useCart'
import ErrorMessage from '../components/ui/ErrorMessage'
import HelpLink from '../components/ui/HelpLink'
import Loading from '../components/ui/Loading'
import Media from '../components/ui/Media'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatDate, formatNaira } from '../lib/format'

export default function ProductPage() {
  const { idOrSlug } = useParams()
  const { data: product, isLoading, error } = useProduct(idOrSlug)
  usePageTitle(product?.title ?? 'Piece')
  const { add } = useCart()

  const [imageIndex, setImageIndex] = useState(0)
  const [size, setSize] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [added, setAdded] = useState(false)

  if (isLoading) return <Loading />
  if (error || !product) return <ErrorMessage error={error ?? new Error('Piece not found')} />

  const needsSize = product.sizes.length > 0
  const collection = product.collection

  function addToCart() {
    if (!product) return
    if (needsSize && !size) {
      setNotice('Please choose a size first.')
      return
    }
    setNotice(null)
    add({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      imageUrl: product.imageUrls[0] ?? null,
      priceNgn: product.priceNgn,
      size: needsSize ? size : null,
    })
    setAdded(true)
  }

  return (
    <article className="pt-1 lg:grid lg:grid-cols-2 lg:gap-14 lg:pt-6">
      <div>
        <Media src={product.imageUrls[imageIndex] ?? product.imageUrls[0]} seed={product.slug} alt={product.title} className="aspect-[4/5] w-full max-h-[78dvh]" />
        {product.imageUrls.length > 1 ? (
          <ul aria-label="Photos" className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {product.imageUrls.map((url, i) => (
              <li key={url} className="flex-none">
                <button
                  type="button"
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === imageIndex}
                  onClick={() => setImageIndex(i)}
                  className={`block size-16 overflow-hidden rounded border ${i === imageIndex ? 'border-ink' : 'border-line opacity-70'}`}
                >
                  <img src={url} alt="" className="size-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-4 lg:mt-0 lg:self-center">
        <p className="tag">{collection ? collection.title : 'Single piece'}</p>
        <h1 data-anim="reveal" className="mt-1 font-serif text-[22px] lg:text-[36px]">
          {product.title}
        </h1>
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="price text-[19px] lg:text-[24px]">{formatNaira(product.priceNgn)}</p>
          {product.orderable && !needsSize ? (
            <button type="button" onClick={addToCart} className="btn btn-sm">
              Add to Cart
            </button>
          ) : null}
        </div>

        {product.story ? <p className="mt-4 text-[12px] leading-[1.7] text-ink-soft lg:text-[14px]">{product.story}</p> : null}
        <p className="mt-3 flex items-center gap-2 text-[12px] text-ink-soft">
          Colour: {product.colorName}
          {product.colorHex ? <span aria-hidden="true" data-swatch={product.colorHex} style={{ background: product.colorHex }} className="inline-block size-3.5 rounded-full border border-line" /> : null}
        </p>
        {collection ? (
          <p className="mt-1 text-[12px] text-ink-soft">
            From{' '}
            <Link to={`/collections/${collection.slug}`} className="underline underline-offset-4">
              {collection.title}
            </Link>
          </p>
        ) : null}
        {product.releaseAt ? <p className="mt-1 text-[12px] text-ink-faint">Released {formatDate(product.releaseAt)}</p> : null}

        {product.orderable ? (
          <div className="mt-5">
            {needsSize ? (
              <fieldset>
                <legend>Size</legend>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={size === s}
                      onClick={() => setSize(s)}
                      className={`min-w-11 rounded-full border px-3.5 py-2 text-[12px] ${size === s ? 'border-ink bg-ink text-bg' : 'border-line text-ink-soft hover:bg-bg-alt'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : null}
            {needsSize ? (
              <button type="button" onClick={addToCart} className="btn btn-block mt-5 lg:inline-flex lg:w-auto">
                Add to Cart
              </button>
            ) : null}
            {notice ? <p role="alert" className="mt-3">{notice}</p> : null}
            {added ? (
              <p role="status" className="mt-3">
                Added to your bag. <Link to="/cart" className="underline underline-offset-4">View bag</Link>
              </p>
            ) : null}
            <p className="mt-5 text-[11px] leading-relaxed text-ink-faint">
              Pieces in a collection come exactly as shown. To change a colour or design, <Link to="/account/consultations/new" className="underline underline-offset-4">book a private salon</Link>.
            </p>
          </div>
        ) : (
          <aside role="note" className="mt-5 rounded-[10px] border border-line bg-white/50 p-4 text-[12px] leading-relaxed text-ink-soft">
            {collection?.status === 'archived' || product.status === 'archived' ? (
              <>
                <p>This piece belongs to an archived collection and can no longer be ordered.</p>
                <div className="mt-3">
                  <HelpLink about={product.title} />
                </div>
              </>
            ) : product.status === 'sold_out' || product.stock <= 0 ? (
              <p>This piece is sold out.</p>
            ) : collection?.availability === 'upcoming' ? (
              <p>This piece is not open for orders yet.</p>
            ) : (
              <p>This piece is not available right now.</p>
            )}
          </aside>
        )}
      </div>
    </article>
  )
}
