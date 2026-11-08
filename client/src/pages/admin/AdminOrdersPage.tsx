import { useState } from 'react'
import { useAllOrders, useUpdateOrderStatus, type StaffOrderStatus } from '../../api/orders'
import { useAuth } from '../../auth/useAuth'
import ErrorMessage from '../../components/ui/ErrorMessage'
import LoadMore from '../../components/ui/LoadMore'
import Loading from '../../components/ui/Loading'
import StatusBadge from '../../components/ui/StatusBadge'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate, formatNaira, humanize } from '../../lib/format'
import type { Order, OrderStatus } from '../../types/api'

const NEXT: Record<OrderStatus, StaffOrderStatus[]> = {
  pending_payment: ['cancelled'],
  paid: ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  needs_attention: ['processing', 'cancelled', 'refunded'],
  cancelled: [],
  refunded: [],
}

const STATUSES: OrderStatus[] = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'needs_attention', 'cancelled', 'refunded']

function OrderRow({ order }: { order: Order }) {
  const { can } = useAuth()
  const update = useUpdateOrderStatus()
  const [note, setNote] = useState('')
  const a = order.shippingAddress

  return (
    <li>
      <details>
        <summary>
          {order.orderNumber} · {order.userEmail ?? order.userId} · {formatNaira(order.totalNgn)} · <StatusBadge status={order.status} /> · {formatDate(order.createdAt)}
        </summary>
        <ul>
          {order.items.map((i) => (
            <li key={`${i.productId}:${i.size ?? ''}`}>
              {i.title}
              {i.size ? ` (${i.size})` : ''} × {i.quantity} — {formatNaira(i.unitPriceNgn * i.quantity)}
            </li>
          ))}
        </ul>
        <address>
          {a.fullName ? `${a.fullName}, ` : ''}
          {a.line1}
          {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state}, {a.country} {a.phone ? `· ${a.phone}` : ''}
        </address>
        {order.notes ? <p>Customer note: {order.notes}</p> : null}
        <p>
          Payment: {order.paymentStatus}
          {order.paymentReference ? ` · ${order.paymentReference}` : ''}
        </p>
        {order.status === 'needs_attention' ? <p role="alert">Payment received but the order could not be fulfilled automatically. Resolve it or refund it from the Paystack dashboard, then update the status.</p> : null}
        {can('orders:write') && NEXT[order.status].length > 0 ? (
          <div>
            <input aria-label="Note (optional)" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            {NEXT[order.status].map((s) => (
              <button
                key={s}
                type="button"
                disabled={update.isPending}
                onClick={() => {
                  if ((s === 'cancelled' || s === 'refunded') && !window.confirm(`Mark this order as ${s}?`)) return
                  update.mutate({ id: order.id, status: s, note: note.trim() || undefined })
                }}
              >
                Mark {humanize(s).toLowerCase()}
              </button>
            ))}
          </div>
        ) : null}
        <ErrorMessage error={update.error} />
      </details>
    </li>
  )
}

export default function AdminOrdersPage() {
  usePageTitle('Orders · Admin')
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const orders = useAllOrders(status || undefined)

  return (
    <div>
      <h1>Orders</h1>
      <label>
        <span>Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | '')}>
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {humanize(s)}
            </option>
          ))}
        </select>
      </label>
      {orders.isLoading ? <Loading /> : null}
      <ErrorMessage error={orders.error} />
      <ul>
        {orders.items.map((o) => (
          <OrderRow key={o.id} order={o} />
        ))}
      </ul>
      {!orders.isLoading && orders.items.length === 0 ? <p>No orders found.</p> : null}
      <LoadMore hasNextPage={!!orders.hasNextPage} isFetchingNextPage={orders.isFetchingNextPage} onClick={() => void orders.fetchNextPage()} />
    </div>
  )
}
