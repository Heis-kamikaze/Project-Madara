import { Link } from 'react-router-dom'
import { useCart } from '../cart/useCart'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatNaira } from '../lib/format'

export default function CartPage() {
  usePageTitle('Cart')
  const { items, subtotalNgn, setQuantity, remove } = useCart()

  if (items.length === 0) {
    return (
      <section>
        <h1>Your cart</h1>
        <p>Your cart is empty.</p>
        <Link to="/pieces">Browse pieces</Link>
      </section>
    )
  }

  return (
    <section>
      <h1>Your cart</h1>
      <ul>
        {items.map((item) => (
          <li key={`${item.productId}:${item.size ?? ''}`}>
            {item.imageUrl ? <img src={item.imageUrl} alt="" width={96} height={96} /> : null}
            <div>
              <Link to={`/pieces/${item.slug}`}>{item.title}</Link>
              {item.size ? <p>Size: {item.size}</p> : null}
              <p>{formatNaira(item.priceNgn)}</p>
              <label>
                <span>Quantity</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={item.quantity}
                  onChange={(e) => setQuantity(item.productId, item.size, Number(e.target.value))}
                />
              </label>
              <button type="button" onClick={() => remove(item.productId, item.size)}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p>
        Subtotal: <strong>{formatNaira(subtotalNgn)}</strong>
      </p>
      <p>Shipping is calculated when you place the order.</p>
      <Link to="/checkout">Checkout</Link>
    </section>
  )
}
