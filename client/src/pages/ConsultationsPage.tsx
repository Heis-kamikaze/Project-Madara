import { Link } from 'react-router-dom'
import { useMyConsultations } from '../api/consultations'
import ErrorMessage from '../components/ui/ErrorMessage'
import LoadMore from '../components/ui/LoadMore'
import Loading from '../components/ui/Loading'
import StatusBadge from '../components/ui/StatusBadge'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatDate, humanize } from '../lib/format'

export default function ConsultationsPage() {
  usePageTitle('Consultations')
  const list = useMyConsultations()
  return (
    <section className="pt-2 lg:mx-auto lg:max-w-2xl lg:pt-6">
      <h1 className="sr-only">Private salon bookings</h1>
      <Link to="/account/consultations/new" className="btn btn-sm">Book a consultation</Link>
      {list.isLoading ? <Loading /> : null}
      <ErrorMessage error={list.error} />
      {!list.isLoading && list.items.length === 0 ? <p className="mt-6 font-serif text-[15px] italic text-ink-soft">No bookings yet.</p> : null}
      <ul className="mt-4 divide-y divide-line">
        {list.items.map((c) => (
          <li key={c.id}>
            <Link to={`/account/consultations/${c.id}`} className="flex items-center justify-between gap-3 py-3.5">
              <div>
                <p className="text-[12.5px] font-semibold">{humanize(c.type)}</p>
                <p className="mt-0.5 text-[10.5px] text-ink-faint">{formatDate(c.scheduledAt ?? c.requestedSlot, true)}</p>
              </div>
              <StatusBadge status={c.status} />
            </Link>
          </li>
        ))}
      </ul>
      <LoadMore hasNextPage={!!list.hasNextPage} isFetchingNextPage={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()} />
    </section>
  )
}
