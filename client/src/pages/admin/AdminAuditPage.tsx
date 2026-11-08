import { useAuditLogs } from '../../api/admin'
import ErrorMessage from '../../components/ui/ErrorMessage'
import LoadMore from '../../components/ui/LoadMore'
import Loading from '../../components/ui/Loading'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate } from '../../lib/format'

export default function AdminAuditPage() {
  usePageTitle('Audit log · Admin')
  const logs = useAuditLogs()
  return (
    <div>
      <h1>Audit log</h1>
      {logs.isLoading ? <Loading /> : null}
      <ErrorMessage error={logs.error} />
      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Who</th>
            <th>Action</th>
            <th>On</th>
          </tr>
        </thead>
        <tbody>
          {logs.items.map((l) => (
            <tr key={l.id}>
              <td>{formatDate(l.createdAt, true)}</td>
              <td>
                {l.actorEmail ?? l.actorUid ?? 'system'}
                {l.actorRole ? ` (${l.actorRole})` : ''}
              </td>
              <td>{l.action}</td>
              <td>
                {l.entity} <code>{l.entityId}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <LoadMore hasNextPage={!!logs.hasNextPage} isFetchingNextPage={logs.isFetchingNextPage} onClick={() => void logs.fetchNextPage()} />
    </div>
  )
}
