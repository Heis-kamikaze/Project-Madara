// import { useState, type FormEvent } from 'react'
// import { Link, useSearchParams } from 'react-router-dom'
// import { useMyConversations, useStartConversation } from '../api/support'
// import { useAuth } from '../auth/useAuth'
// import ErrorMessage from '../components/ui/ErrorMessage'
// import Field from '../components/ui/Field'
// import Loading from '../components/ui/Loading'
// import ChatThread from '../components/support/ChatThread'
// import { usePageTitle } from '../hooks/usePageTitle'
// import { formatDate } from '../lib/format'

// /** Customer help chat. `?message=…` pre-fills the first message (used by the archived-collection help button). */
// export default function SupportPage() {
//   usePageTitle('Help')
//   const { status } = useAuth()
//   const [params] = useSearchParams()
//   const signedIn = status === 'signedIn'
//   const conversations = useMyConversations(signedIn)
//   const start = useStartConversation()
//   const [activeId, setActiveId] = useState<string | null>(null)
//   const [text, setText] = useState(params.get('message') ?? '')

//   if (status === 'loading') return <Loading />
//   if (!signedIn) {
//     return (
//       <section>
//         <h1>Help</h1>
//         <p>
//           <Link to={`/login?next=${encodeURIComponent('/support' + (params.toString() ? `?${params}` : ''))}`}>Sign in</Link> to chat with the Aradam team.
//         </p>
//       </section>
//     )
//   }

//   const active = conversations.items.find((c) => c.id === activeId)

//   async function onStart(e: FormEvent) {
//     e.preventDefault()
//     const value = text.trim()
//     if (!value) return
//     const res = await start.mutateAsync(value)
//     setActiveId(res.data.conversation.id)
//     setText('')
//   }

//   return (
//     <section>
//       <h1>Help</h1>

//       {active ? (
//         <>
//           <button type="button" onClick={() => setActiveId(null)}>
//             ← All conversations
//           </button>
//           <ChatThread conversation={active} />
//         </>
//       ) : (
//         <>
//           <form onSubmit={onStart}>
//             <Field label="How can we help?">
//               <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} rows={4} required />
//             </Field>
//             <button type="submit" disabled={start.isPending}>
//               {start.isPending ? 'Sending…' : 'Start a conversation'}
//             </button>
//             <ErrorMessage error={start.error} />
//           </form>

//           <h2>Your conversations</h2>
//           {conversations.isLoading ? <Loading /> : null}
//           <ErrorMessage error={conversations.error} />
//           {!conversations.isLoading && conversations.items.length === 0 ? <p>No conversations yet.</p> : null}
//           <ul>
//             {conversations.items.map((c) => (
//               <li key={c.id}>
//                 <button type="button" onClick={() => setActiveId(c.id)}>
//                   {c.lastMessagePreview}
//                 </button>{' '}
//                 <small>
//                   {formatDate(c.lastMessageAt, true)} · {c.status}
//                 </small>
//               </li>
//             ))}
//           </ul>
//         </>
//       )}
//     </section>
//   )
// }
