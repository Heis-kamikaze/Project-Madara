// import { useState } from 'react'
// import { Link, useParams } from 'react-router-dom'
// import { startPayment, useCancelOrder, useOrder } from '../api/orders'
// import ErrorMessage from '../components/ui/ErrorMessage'
// import Loading from '../components/ui/Loading'
// import StatusBadge from '../components/ui/StatusBadge'
// import { usePageTitle } from '../hooks/usePageTitle'
// import { errorMessage } from '../lib/api'
// import { formatDate, formatNaira } from '../lib/format'

// export default function OrderPage() {
//   const { id } = useParams()
//   const { data: order, isLoading, error } = useOrder(id)
//   usePageTitle(order ? `Order ${order.orderNumber}` : 'Order')
//   const cancel = useCancelOrder()
//   const [payError, setPayError] = useState<string | null>(null)
//   const [paying, setPaying] = useState(false)

//   if (isLoading) return <Loading />
//   if (error || !order) return <ErrorMessage error={error ?? new Error('Order not found')} />

//   async function pay() {
//     if (!order) return
//     setPaying(true)
//     setPayError(null)
//     try {
//       const payment = await startPayment(order.id)
//       window.location.assign(payment.authorizationUrl)
//     } catch (err) {
//       setPayError(errorMessage(err))
//       setPaying(false)
//     }
//   }

//   const a = order.shippingAddress
//   return (
//     <article>
//       <p>
//         <Link to="/account/orders">← My orders</Link>
//       </p>
//       <h1>Order {order.orderNumber}</h1>
//       <p>
//         <StatusBadge status={order.status} /> · placed {formatDate(order.createdAt, true)}
//       </p>

//       <ul>
//         {order.items.map((i) => (
//           <li key={`${i.productId}:${i.size ?? ''}`}>
//             {i.imageUrl ? <img src={i.imageUrl} alt="" width={64} height={64} /> : null}
//             {i.title}
//             {i.size ? ` (${i.size})` : ''} × {i.quantity} — {formatNaira(i.unitPriceNgn * i.quantity)}
//           </li>
//         ))}
//       </ul>
//       <dl>
//         <dt>Subtotal</dt>
//         <dd>{formatNaira(order.subtotalNgn)}</dd>
//         <dt>Shipping</dt>
//         <dd>{formatNaira(order.shippingFeeNgn)}</dd>
//         <dt>Total</dt>
//         <dd>
//           <strong>{formatNaira(order.totalNgn)}</strong>
//         </dd>
//       </dl>

//       <h2>Delivery address</h2>
//       <address>
//         {a.fullName ? <>{a.fullName}<br /></> : null}
//         {a.line1}
//         <br />
//         {a.line2 ? <>{a.line2}<br /></> : null}
//         {a.city}, {a.state} {a.postalCode ?? ''}
//         <br />
//         {a.country}
//         {a.phone ? <><br />{a.phone}</> : null}
//       </address>

//       {order.status === 'pending_payment' ? (
//         <p>
//           <button type="button" onClick={() => void pay()} disabled={paying}>
//             {paying ? 'Opening payment…' : 'Pay now'}
//           </button>
//           <button type="button" onClick={() => cancel.mutate(order.id)} disabled={cancel.isPending}>
//             Cancel order
//           </button>
//         </p>
//       ) : null}
//       {payError ? <p role="alert">{payError}</p> : null}
//       <ErrorMessage error={cancel.error} />
//     </article>
//   )
// }
