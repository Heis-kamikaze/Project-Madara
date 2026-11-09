import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { startPayment, useCancelOrder, useOrder } from '../api/orders'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import Media from '../components/ui/Media'
import StatusBadge from '../components/ui/StatusBadge'
import { usePageTitle } from '../hooks/usePageTitle'
import { errorMessage } from '../lib/api'
import { formatDate, formatNaira } from '../lib/format'

export default function OrderPage() {
  const { id } = useParams()
  const { data: order, isLoading, error } = useOrder(id)
  usePageTitle(order ? `Order ${order.orderNumber}` : 'Order')
  const cancel = useCancelOrder()
  const [payError, setPayError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)

  if (isLoading) return <Loading />
  if (error || !order) return <ErrorMessage error={error ?? new Error('Order not found')} />

  async function pay() {
    if (!order) return
    setPaying(true)
    setPayError(null)
    try {
      const payment = await startPayment(order.id)
      window.location.assign(payment.authorizationUrl)
    } catch (err) {
      setPayError(errorMessage(err))
      setPaying(false)
    }
  }

  const a = order.shippingAddress
  return (
    <article className="pt-1 lg:mx-auto lg:max-w-2xl lg:pt-6">
      <p className="eyebrow">Order</p>
      <h1 className="mt-1 font-serif text-[24px]">{order.orderNumber}</h1>
      <p className="mt-2 flex items-center gap-2 text-[11px] text-ink-faint">
        <StatusBadge status={order.status} /> placed {formatDate(order.createdAt, true)}
      </p>

      <ul className="mt-5 divide-y divide-line">
        {order.items.map((i) => (
          <li key={`${i.productId}:${i.size ?? ''}`} className="flex gap-3 py-3">
            <Media src={i.imageUrl} seed={i.productId} className="h-[60px] w-12 flex-none" />
            <p className="flex-1 text-[12.5px]">
              {i.title}
              {i.size ? <span className="text-ink-faint"> · {i.size}</span> : null}
              <span className="block text-[10.5px] text-ink-faint">Qty {i.quantity}</span>
            </p>
            <p className="price text-[13px]">{formatNaira(i.unitPriceNgn * i.quantity)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-6 text-[12.5px]">
        <dt className="!mt-1">Subtotal</dt>
        <dd className="!mt-1 text-right">{formatNaira(order.subtotalNgn)}</dd>
        <dt className="!mt-1">Shipping</dt>
        <dd className="!mt-1 text-right">{formatNaira(order.shippingFeeNgn)}</dd>
        <dt className="!mt-2 !text-ink">Total</dt>
        <dd className="price !mt-2 text-right text-[16px]">{formatNaira(order.totalNgn)}</dd>
      </dl>

      <h2 className="mt-8 font-serif text-[17px]">Delivery address</h2>
      <address className="mt-2">
        {a.fullName ? <>{a.fullName}<br /></> : null}
        {a.line1}
        <br />
        {a.line2 ? <>{a.line2}<br /></> : null}
        {a.city}, {a.state} {a.postalCode ?? ''}
        <br />
        {a.country}
        {a.phone ? <><br />{a.phone}</> : null}
      </address>

      {order.status === 'pending_payment' ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => void pay()} disabled={paying} className="btn">
            {paying ? 'Opening payment…' : 'Pay now'}
          </button>
          <button type="button" onClick={() => cancel.mutate(order.id)} disabled={cancel.isPending} className="btn btn-outline">
            Cancel order
          </button>
        </div>
      ) : null}
      {payError ? <p role="alert" className="mt-3">{payError}</p> : null}
      <ErrorMessage error={cancel.error} />
    </article>
  )
}
