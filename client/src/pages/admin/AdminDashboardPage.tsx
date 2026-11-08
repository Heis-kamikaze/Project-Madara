import { useAdminStats } from '../../api/admin'
import { useAuth } from '../../auth/useAuth'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Loading from '../../components/ui/Loading'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatNaira } from '../../lib/format'

export default function AdminDashboardPage() {
  usePageTitle('Admin')
  const { can, me } = useAuth()
  const canSeeStats = can('analytics:read')
  const { data: s, isLoading, error } = useAdminStats(canSeeStats)

  return (
    <div>
      <h1>Overview</h1>
      {!canSeeStats ? <p>Welcome{me?.profile?.displayName ? `, ${me.profile.displayName}` : ''}. Use the menu to open the tools available to your role.</p> : null}
      {canSeeStats && isLoading ? <Loading /> : null}
      <ErrorMessage error={error} />
      {s ? (
        <dl>
          <dt>Revenue (paid orders)</dt>
          <dd>{formatNaira(s.orders.revenueNgn)}</dd>
          <dt>Orders</dt>
          <dd>
            {s.orders.total} total · {s.orders.paid} paid · {s.orders.pendingPayment} awaiting payment
          </dd>
          <dt>Orders needing attention</dt>
          <dd data-alert={s.orders.needsAttention > 0}>{s.orders.needsAttention}</dd>
          <dt>Pieces</dt>
          <dd>
            {s.pieces.active} available · {s.pieces.soldOut} sold out
          </dd>
          <dt>Collections</dt>
          <dd>
            {s.collections.active} current · {s.collections.archived} archived
          </dd>
          <dt>Consultations</dt>
          <dd>
            {s.consultations.requested} to confirm · {s.consultations.confirmed} scheduled
          </dd>
          <dt>Open support chats</dt>
          <dd>{s.support.openConversations}</dd>
          <dt>Customers</dt>
          <dd>{s.customers}</dd>
        </dl>
      ) : null}
    </div>
  )
}
