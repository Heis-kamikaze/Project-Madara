import { Link } from 'react-router-dom'
import { useArchiveCollection, useCollections, useDeleteCollection, usePublishCollection } from '../../api/collections'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Loading from '../../components/ui/Loading'
import StatusBadge from '../../components/ui/StatusBadge'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate } from '../../lib/format'

export default function AdminCollectionsPage() {
  usePageTitle('Collections · Admin')
  const { data, isLoading, error } = useCollections({ status: 'all', sort: 'created', order: 'desc' })
  const publish = usePublishCollection()
  const archive = useArchiveCollection()
  const remove = useDeleteCollection()

  return (
    <div>
      <h1>Collections</h1>
      <p>
        <Link to="/admin/collections/new">New collection</Link>
      </p>
      {isLoading ? <Loading /> : null}
      <ErrorMessage error={error ?? publish.error ?? archive.error ?? remove.error} />
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Window</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((c) => (
            <tr key={c.id}>
              <td>
                <Link to={`/admin/collections/${c.id}`}>{c.title}</Link>
              </td>
              <td>
                <StatusBadge status={c.status} />
                {c.archiveReason ? ` (${c.archiveReason.replace('_', ' ')})` : ''}
              </td>
              <td>
                {formatDate(c.availableFrom)} → {formatDate(c.availableUntil)}
              </td>
              <td>
                {c.status === 'draft' ? (
                  <>
                    <button type="button" onClick={() => publish.mutate(c.id)}>
                      Publish
                    </button>
                    <button type="button" onClick={() => window.confirm(`Delete "${c.title}"?`) && remove.mutate(c.id)}>
                      Delete
                    </button>
                  </>
                ) : null}
                {c.status === 'active' ? (
                  <button type="button" onClick={() => window.confirm(`Archive "${c.title}" now? Its pieces will no longer be orderable.`) && archive.mutate(c.id)}>
                    Archive
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
