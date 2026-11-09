import { Link } from 'react-router-dom'
import { useCart } from '../cart/useCart'
import Media from '../components/ui/Media'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatNaira } from '../lib/format'

export default function CartPage() {
  usePageTitle('Your Bag')
  const { items, subtotalNgn, setQuantity, remove } = useCart()

  if (items.length === 0) {
    return (
      <section className="pt-6 text-center">
        <h1 className="sr-only">Your Bag</h1>
        <p className="font-serif text-[17px] italic text-ink-soft">Your bag is empty.</p>
        <Link to="/pieces" className="btn btn-outline btn-sm mt-5">
          Browse singles
        </Link>
      </section>
    )
  }

  return (
    <section className="pt-2 lg:mx-auto lg:max-w-2xl lg:pt-6">
      <h1 className="sr-only">Your Bag</h1>
      <ul data-anim="stagger">
        {items.map((item) => (
          <li key={`${item.productId}:${item.size ?? ''}`} className="flex gap-3 border-b border-line py-3.5">
            <Media src={item.imageUrl} seed={item.slug} className="h-[70px] w-14 flex-none lg:h-24 lg:w-20" />
            <div className="min-w-0 flex-1">
              <Link to={`/pieces/${item.slug}`} className="block truncate text-[12.5px] font-semibold lg:text-[14px]">
                {item.title}
              </Link>
              {item.size ? <p className="mt-0.5 text-[10.5px] text-ink-faint">Size {item.size}</p> : null}
              <div className="mt-2 flex items-center gap-3">
                <div className="inline-flex items-center rounded-full border border-line">
                  <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(item.productId, item.size, item.quantity - 1)} className="size-7 text-[14px] leading-none">
                    −
                  </button>
                  <span className="min-w-5 text-center text-[11.5px]" aria-live="polite">{item.quantity}</span>
                  <button type="button" aria-label="Increase quantity" onClick={() => setQuantity(item.productId, item.size, item.quantity + 1)} className="size-7 text-[14px] leading-none">
                    +
                  </button>
                </div>
                <button type="button" onClick={() => remove(item.productId, item.size)} className="text-[10.5px] text-ink-faint underline">
                  Remove
                </button>
              </div>
            </div>
            <p className="price text-[13px] lg:text-[15px]">{formatNaira(item.priceNgn * item.quantity)}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[12px] text-ink-soft">Subtotal</span>
        <span className="price text-[15px]">{formatNaira(subtotalNgn)}</span>
      </div>
      <Link to="/checkout" className="btn btn-block mt-5">
        Checkout
      </Link>
      <p className="mt-2.5 text-center text-[10px] text-ink-faint">Shipping is added when the order is placed. Archived pieces cannot be ordered — ask Help if unsure.</p>
    </section>
  )
}
