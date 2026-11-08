// import { Link } from 'react-router-dom'
// import { useDeleteMessage, useInbox, useMarkAllRead, useMarkRead } from '../api/inbox'
// import ErrorMessage from '../components/ui/ErrorMessage'
// import Loading from '../components/ui/Loading'
// import { usePageTitle } from '../hooks/usePageTitle'
// import { formatDate } from '../lib/format'

// /** Updates on orders, fittings and production. Every message is also emailed to you. */
// export default function InboxPage() {
//   usePageTitle('Inbox')
//   const inbox = useInbox()
//   const markRead = useMarkRead()
//   const markAll = useMarkAllRead()
//   const remove = useDeleteMessage()
//   const messages = inbox.data?.data ?? []
//   const unread = typeof inbox.data?.meta?.unread === 'number' ? inbox.data.meta.unread : 0

//   return (
//     <section>
//       <h1>Inbox{unread > 0 ? ` (${unread} unread)` : ''}</h1>
//       {unread > 0 ? (
//         <button type="button" disabled={markAll.isPending} onClick={() => markAll.mutate()}>
//           Mark all as read
//         </button>
//       ) : null}
//       {inbox.isLoading ? <Loading /> : null}
//       <ErrorMessage error={inbox.error ?? markRead.error ?? markAll.error ?? remove.error} />
//       {!inbox.isLoading && messages.length === 0 ? <p>No messages yet.</p> : null}
//       <ul>
//         {messages.map((m) => (
//           <li key={m.id} data-read={m.read} data-type={m.type}>
//             <h2>{m.title}</h2>
//             <p>{m.body}</p>
//             <time dateTime={m.createdAt}>{formatDate(m.createdAt, true)}</time>
//             <div>
//               {m.link ? (
//                 <Link to={m.link} onClick={() => !m.read && markRead.mutate(m.id)}>
//                   Open
//                 </Link>
//               ) : null}
//               {!m.read ? (
//                 <button type="button" onClick={() => markRead.mutate(m.id)}>
//                   Mark as read
//                 </button>
//               ) : null}
//               <button type="button" onClick={() => remove.mutate(m.id)}>
//                 Delete
//               </button>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </section>
//   )
// }
