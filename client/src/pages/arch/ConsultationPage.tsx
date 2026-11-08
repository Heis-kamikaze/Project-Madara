// import { Link, useParams } from 'react-router-dom'
// import { useCancelConsultation, useConsultation } from '../api/consultations'
// import ErrorMessage from '../components/ui/ErrorMessage'
// import Loading from '../components/ui/Loading'
// import StatusBadge from '../components/ui/StatusBadge'
// import { usePageTitle } from '../hooks/usePageTitle'
// import { formatDate, humanize } from '../lib/format'

// export default function ConsultationPage() {
//   const { id } = useParams()
//   const { data: c, isLoading, error } = useConsultation(id)
//   usePageTitle('Consultation')
//   const cancel = useCancelConsultation()

//   if (isLoading) return <Loading />
//   if (error || !c) return <ErrorMessage error={error ?? new Error('Consultation not found')} />

//   return (
//     <article>
//       <p>
//         <Link to="/account/consultations">← My consultations</Link>
//       </p>
//       <h1>{humanize(c.type)}</h1>
//       <p>
//         <StatusBadge status={c.status} />
//       </p>
//       <dl>
//         <dt>Requested time</dt>
//         <dd>{formatDate(c.requestedSlot, true)}</dd>
//         <dt>Confirmed time</dt>
//         <dd>{c.scheduledAt ? formatDate(c.scheduledAt, true) : 'Not confirmed yet'}</dd>
//       </dl>
//       {c.notes ? <p style={{ whiteSpace: 'pre-wrap' }}>{c.notes}</p> : null}
//       {c.measurements ? (
//         <ul aria-label="Measurements">
//           {Object.entries(c.measurements).map(([name, value]) => (
//             <li key={name}>
//               {name}: {value} cm
//             </li>
//           ))}
//         </ul>
//       ) : null}
//       {c.referenceImageUrls.length > 0 ? (
//         <div>
//           {c.referenceImageUrls.map((url) => (
//             <img key={url} src={url} alt="Reference" width={160} />
//           ))}
//         </div>
//       ) : null}
//       {c.status === 'requested' || c.status === 'confirmed' ? (
//         <button type="button" disabled={cancel.isPending} onClick={() => cancel.mutate(c.id)}>
//           Cancel consultation
//         </button>
//       ) : null}
//       <ErrorMessage error={cancel.error} />
//     </article>
//   )
// }
