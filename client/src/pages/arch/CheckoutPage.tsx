import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { startPayment, useCreateOrder } from '../api/orders'
import { useAuth } from '../auth/useAuth'
import { useCart } from '../cart/useCart'
import AddressForm from '../components/ui/AddressForm'
import Field from '../components/ui/Field'
import HelpLink from '../components/ui/HelpLink'
import Loading from '../components/ui/Loading'
import { usePageTitle } from '../hooks/usePageTitle'
import { toAddress, toDraft, type AddressDraft } from '../lib/address'
import { ApiError, errorMessage } from '../lib/api'
import { formatNaira } from '../lib/format'
import type { Address } from '../types/api'

function CheckoutForm({ initialAddress }: { initialAddress: Address | null | undefined }) {
  const { items, subtotalNgn, clear } = useCart()
  const createOrder = useCreateOrder()
  const [address, setAddress] = useState<AddressDraft>(() => toDraft(initialAddress))
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [unpaidOrderId, setUnpaidOrderId] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    let orderId: string | null = null
    try {
      const res = await createOrder.mutateAsync({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, ...(i.size ? { size: i.size } : {}) })),
        shippingAddress: toAddress(address),
        notes: notes.trim() || undefined,
      })
      orderId = res.data.id
      const payment = await startPayment(orderId)
      clear()
      window.location.assign(payment.authorizationUrl) // off to Paystack
    } catch (err) {
      setError(err)
      // The order exists but payment could not start: let the customer retry from the order page.
      if (orderId) setUnpaidOrderId(orderId)
      setBusy(false)
    }
  }

  const showHelp = error instanceof ApiError && error.code === 'COLLECTION_ARCHIVED'

  return (
    <section>
      <h1>Checkout</h1>
      <ul aria-label="Order summary">
        {items.map((i) => (
          <li key={`${i.productId}:${i.size ?? ''}`}>
            {i.title}
            {i.size ? ` (${i.size})` : ''} × {i.quantity} — {formatNaira(i.priceNgn * i.quantity)}
          </li>
        ))}
      </ul>
      <p>
        Subtotal: <strong>{formatNaira(subtotalNgn)}</strong> (shipping is added when the order is placed)
      </p>

      <form onSubmit={onSubmit}>
        <h2>Delivery address</h2>
        <AddressForm value={address} onChange={setAddress} />
        <Field label="Notes for the team (optional)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={3} />
        </Field>
        <button type="submit" disabled={busy}>
          {busy ? 'Placing your order…' : 'Place order and pay'}
        </button>
      </form>

      {error ? <p role="alert">{errorMessage(error)}</p> : null}
      {showHelp ? <HelpLink /> : null}
      {unpaidOrderId ? (
        <p>
          Your order was saved. <Link to={`/account/orders/${unpaidOrderId}`}>Open it to try paying again.</Link>
        </p>
      ) : null}
    </section>
  )
}

export default function CheckoutPage() {
  usePageTitle('Checkout')
  const { items } = useCart()
  const { me } = useAuth()

  if (items.length === 0) {
    return (
      <section>
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
        <Link to="/pieces">Browse pieces</Link>
      </section>
    )
  }
  if (!me) return <Loading />
  return <CheckoutForm initialAddress={me.profile?.address} />
}
