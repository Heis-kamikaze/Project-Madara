// import { Link } from 'react-router-dom'
// import { useMyOrders } from '../api/orders'
// import ErrorMessage from '../components/ui/ErrorMessage'
// import LoadMore from '../components/ui/LoadMore'
// import Loading from '../components/ui/Loading'
// import StatusBadge from '../components/ui/StatusBadge'
// import { usePageTitle } from '../hooks/usePageTitle'
// import { formatDate, formatNaira } from '../lib/format'

// export default function OrdersPage() {
//   usePageTitle('My orders')
//   const orders = useMyOrders()
//   return (
//     <section>
//       <h1>My orders</h1>
//       {orders.isLoading ? <Loading /> : null}
//       <ErrorMessage error={orders.error} />
//       {!orders.isLoading && orders.items.length === 0 ? (
//         <p>
//           You have not placed an order yet. <Link to="/pieces">Browse pieces</Link>
//         </p>
//       ) : null}
//       <ul>
//         {orders.items.map((o) => (
//           <li key={o.id}>
//             <Link to={`/account/orders/${o.id}`}>{o.orderNumber}</Link> · {formatDate(o.createdAt)} · {formatNaira(o.totalNgn)} · <StatusBadge status={o.status} />
//           </li>
//         ))}
//       </ul>
//       <LoadMore hasNextPage={!!orders.hasNextPage} isFetchingNextPage={orders.isFetchingNextPage} onClick={() => void orders.fetchNextPage()} />
//     </section>
//   )
// }
