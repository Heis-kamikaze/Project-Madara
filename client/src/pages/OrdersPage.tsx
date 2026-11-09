import { Link } from 'react-router-dom'
import { useMyOrders } from '../api/orders'
import ErrorMessage from '../components/ui/ErrorMessage'
import LoadMore from '../components/ui/LoadMore'
import Loading from '../components/ui/Loading'
import StatusBadge from '../components/ui/StatusBadge'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatDate, formatNaira } from '../lib/format'

export default function OrdersPage() {
  usePageTitle('Orders')
  const orders = useMyOrders()
  return (
    <section className="pt-2 lg:mx-auto lg:max-w-2xl lg:pt-6">
      <h1 className="sr-only">My orders</h1>
      {orders.isLoading ? <Loading /> : null}
      <ErrorMessage error={orders.error} />
      {!orders.isLoading && orders.items.length === 0 ? (
        <p className="font-serif text-[15px] italic text-ink-soft">
          No orders yet. <Link to="/pieces" className="underline underline-offset-4">Browse singles</Link>
        </p>
      ) : null}
      <ul className="divide-y divide-line">
        {orders.items.map((o) => (
          <li key={o.id}>
            <Link to={`/account/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3.5">
              <div>
                <p className="text-[12.5px] font-semibold">{o.orderNumber}</p>
                <p className="mt-0.5 text-[10.5px] text-ink-faint">{formatDate(o.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="price text-[13px]">{formatNaira(o.totalNgn)}</p>
                <StatusBadge status={o.status} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <LoadMore hasNextPage={!!orders.hasNextPage} isFetchingNextPage={orders.isFetchingNextPage} onClick={() => void orders.fetchNextPage()} />
    </section>
  )
}
