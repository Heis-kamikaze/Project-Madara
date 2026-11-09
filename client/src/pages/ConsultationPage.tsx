import { useParams } from 'react-router-dom'
import { useCancelConsultation, useConsultation } from '../api/consultations'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import StatusBadge from '../components/ui/StatusBadge'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatDate, humanize } from '../lib/format'

export default function ConsultationPage() {
  const { id } = useParams()
  const { data: c, isLoading, error } = useConsultation(id)
  usePageTitle('Consultation')
  const cancel = useCancelConsultation()

  if (isLoading) return <Loading />
  if (error || !c) return <ErrorMessage error={error ?? new Error('Consultation not found')} />

  return (
    <article className="pt-1 lg:mx-auto lg:max-w-xl lg:pt-6">
      <p className="eyebrow">Private Salon</p>
      <h1 className="mt-1 font-serif text-[24px]">{humanize(c.type)}</h1>
      <p className="mt-2"><StatusBadge status={c.status} /></p>
      <dl className="mt-4">
        <dt>Requested time</dt>
        <dd>{formatDate(c.requestedSlot, true)}</dd>
        <dt>Confirmed time</dt>
        <dd>{c.scheduledAt ? formatDate(c.scheduledAt, true) : 'Not confirmed yet'}</dd>
      </dl>
      {c.notes ? <p className="mt-4 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-soft">{c.notes}</p> : null}
      {c.measurements ? (
        <ul aria-label="Measurements" className="mt-4 text-[12.5px] text-ink-soft">
          {Object.entries(c.measurements).map(([name, value]) => (
            <li key={name}>{name}: {value} cm</li>
          ))}
        </ul>
      ) : null}
      {c.referenceImageUrls.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {c.referenceImageUrls.map((url) => (
            <img key={url} src={url} alt="Reference" className="size-28 rounded-md object-cover" />
          ))}
        </div>
      ) : null}
      {c.status === 'requested' || c.status === 'confirmed' ? (
        <button type="button" disabled={cancel.isPending} onClick={() => cancel.mutate(c.id)} className="btn btn-outline btn-sm mt-6">
          Cancel consultation
        </button>
      ) : null}
      <ErrorMessage error={cancel.error} />
    </article>
  )
}
