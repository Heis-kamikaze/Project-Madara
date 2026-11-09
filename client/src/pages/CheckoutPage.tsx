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
    <section className="pt-2 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14 lg:pt-6">
      <h1 className="sr-only">Checkout</h1>
      <form onSubmit={onSubmit}>
        <h2 className="font-serif text-[20px]">Delivery address</h2>
        <AddressForm value={address} onChange={setAddress} />
        <Field label="Notes for the team (optional)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={3} />
        </Field>
        <button type="submit" disabled={busy} className="btn btn-block">
          {busy ? 'Placing your order…' : 'Place order and pay'}
        </button>
        {error ? <p role="alert">{errorMessage(error)}</p> : null}
        {showHelp ? <div><HelpLink /></div> : null}
        {unpaidOrderId ? (
          <p className="text-[12px]">
            Your order was saved. <Link to={`/account/orders/${unpaidOrderId}`} className="underline underline-offset-4">Open it to try paying again.</Link>
          </p>
        ) : null}
      </form>

      <aside aria-label="Order summary" className="card mt-8 h-fit p-4 lg:mt-0">
        <p className="eyebrow mb-3">Your bag</p>
        <ul className="divide-y divide-line">
          {items.map((i) => (
            <li key={`${i.productId}:${i.size ?? ''}`} className="flex justify-between gap-3 py-2 text-[12px]">
              <span>
                {i.title}
                {i.size ? ` (${i.size})` : ''} × {i.quantity}
              </span>
              <span className="price flex-none">{formatNaira(i.priceNgn * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between border-t border-line pt-3 text-[12px]">
          <span className="text-ink-soft">Subtotal</span>
          <span className="price text-[15px]">{formatNaira(subtotalNgn)}</span>
        </p>
        <p className="mt-1 text-[10.5px] text-ink-faint">Shipping is added when the order is placed.</p>
      </aside>
    </section>
  )
}

export default function CheckoutPage() {
  usePageTitle('Checkout')
  const { items } = useCart()
  const { me } = useAuth()

  if (items.length === 0) {
    return (
      <section className="pt-6 text-center">
        <h1 className="sr-only">Checkout</h1>
        <p className="font-serif text-[17px] italic text-ink-soft">Your bag is empty.</p>
        <Link to="/pieces" className="btn btn-outline btn-sm mt-5">
          Browse singles
        </Link>
      </section>
    )
  }
  if (!me) return <Loading />
  return <CheckoutForm initialAddress={me.profile?.address} />
}
