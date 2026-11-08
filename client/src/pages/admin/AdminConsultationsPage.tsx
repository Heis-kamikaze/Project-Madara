import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAllConsultations, useUpdateConsultation } from '../../api/consultations'
import { useAuth } from '../../auth/useAuth'
import ErrorMessage from '../../components/ui/ErrorMessage'
import LoadMore from '../../components/ui/LoadMore'
import Loading from '../../components/ui/Loading'
import StatusBadge from '../../components/ui/StatusBadge'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate, fromLocalInput, humanize, toLocalInput } from '../../lib/format'
import type { Consultation, ConsultationStatus } from '../../types/api'

function ConsultationRow({ c }: { c: Consultation }) {
  const { can } = useAuth()
  const update = useUpdateConsultation()
  const [when, setWhen] = useState(toLocalInput(c.scheduledAt ?? c.requestedSlot))
  const [notes, setNotes] = useState(c.adminNotes ?? '')
  const open = c.status === 'requested' || c.status === 'confirmed'

  return (
    <li>
      <details>
        <summary>
          {humanize(c.type)} · {c.userEmail ?? c.userId} · {formatDate(c.scheduledAt ?? c.requestedSlot, true)} · <StatusBadge status={c.status} />
        </summary>
        <p>
          Customer id: <code>{c.userId}</code>
        </p>
        {c.notes ? <p style={{ whiteSpace: 'pre-wrap' }}>{c.notes}</p> : null}
        {c.measurements ? (
          <ul>
            {Object.entries(c.measurements).map(([k, v]) => (
              <li key={k}>
                {k}: {v} cm
              </li>
            ))}
          </ul>
        ) : null}
        {c.referenceImageUrls.map((url) => (
          <img key={url} src={url} alt="Reference" width={120} />
        ))}

        {can('consultations:write') && open ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              update.mutate({ id: c.id, patch: { status: 'confirmed', scheduledAt: fromLocalInput(when), adminNotes: notes.trim() || null } })
            }}
          >
            <label>
              <span>Time</span>
              <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required />
            </label>
            <label>
              <span>Internal notes</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={2} />
            </label>
            <button type="submit" disabled={update.isPending}>
              {c.status === 'requested' ? 'Confirm time' : 'Reschedule'}
            </button>
            {c.status === 'confirmed' ? (
              <button type="button" disabled={update.isPending} onClick={() => update.mutate({ id: c.id, patch: { status: 'completed' } })}>
                Mark completed
              </button>
            ) : null}
            <button
              type="button"
              disabled={update.isPending}
              onClick={() => window.confirm('Cancel this consultation?') && update.mutate({ id: c.id, patch: { status: 'cancelled' } })}
            >
              Cancel
            </button>
          </form>
        ) : null}
        {can('closet:manage') && c.isCustom && c.status !== 'cancelled' ? (
          <p>
            <Link to={`/admin/custom-pieces?userId=${encodeURIComponent(c.userId)}&consultationId=${encodeURIComponent(c.id)}`}>Create the custom piece →</Link>
          </p>
        ) : null}
        <ErrorMessage error={update.error} />
      </details>
    </li>
  )
}

export default function AdminConsultationsPage() {
  usePageTitle('Consultations · Admin')
  const [status, setStatus] = useState<ConsultationStatus | ''>('requested')
  const list = useAllConsultations(status || undefined)

  return (
    <div>
      <h1>Consultations</h1>
      <label>
        <span>Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value as ConsultationStatus | '')}>
          <option value="">All</option>
          <option value="requested">To confirm</option>
          <option value="confirmed">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </label>
      {list.isLoading ? <Loading /> : null}
      <ErrorMessage error={list.error} />
      <ul>
        {list.items.map((c) => (
          <ConsultationRow key={`${c.id}:${c.updatedAt}`} c={c} />
        ))}
      </ul>
      {!list.isLoading && list.items.length === 0 ? <p>Nothing here.</p> : null}
      <LoadMore hasNextPage={!!list.hasNextPage} isFetchingNextPage={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()} />
    </div>
  )
}
