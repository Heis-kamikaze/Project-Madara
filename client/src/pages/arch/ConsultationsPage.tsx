// import { Link } from 'react-router-dom'
// import { useMyConsultations } from '../api/consultations'
// import ErrorMessage from '../components/ui/ErrorMessage'
// import LoadMore from '../components/ui/LoadMore'
// import Loading from '../components/ui/Loading'
// import StatusBadge from '../components/ui/StatusBadge'
// import { usePageTitle } from '../hooks/usePageTitle'
// import { formatDate, humanize } from '../lib/format'

// export default function ConsultationsPage() {
//   usePageTitle('My consultations')
//   const list = useMyConsultations()
//   return (
//     <section>
//       <h1>My consultations</h1>
//       <p>
//         <Link to="/account/consultations/new">Book a consultation</Link>
//       </p>
//       {list.isLoading ? <Loading /> : null}
//       <ErrorMessage error={list.error} />
//       {!list.isLoading && list.items.length === 0 ? <p>No consultations yet.</p> : null}
//       <ul>
//         {list.items.map((c) => (
//           <li key={c.id}>
//             <Link to={`/account/consultations/${c.id}`}>{humanize(c.type)}</Link> · {formatDate(c.scheduledAt ?? c.requestedSlot, true)} ·{' '}
//             <StatusBadge status={c.status} />
//           </li>
//         ))}
//       </ul>
//       <LoadMore hasNextPage={!!list.hasNextPage} isFetchingNextPage={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()} />
//     </section>
//   )
// }
