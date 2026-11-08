import { useState } from 'react'
import { useAllConversations, useUpdateConversation } from '../../api/support'
import { useAuth } from '../../auth/useAuth'
import ChatThread from '../../components/support/ChatThread'
import ErrorMessage from '../../components/ui/ErrorMessage'
import LoadMore from '../../components/ui/LoadMore'
import Loading from '../../components/ui/Loading'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate } from '../../lib/format'

export default function AdminSupportPage() {
  usePageTitle('Support · Admin')
  const { can } = useAuth()
  const [status, setStatus] = useState<'open' | 'resolved'>('open')
  const [activeId, setActiveId] = useState<string | null>(null)
  const list = useAllConversations(status)
  const update = useUpdateConversation()
  const active = list.items.find((c) => c.id === activeId)
  const canReply = can('support:reply')

  return (
    <div>
      <h1>Support chats</h1>
      <label>
        <span>Show</span>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as 'open' | 'resolved')
            setActiveId(null)
          }}
        >
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
      </label>

      {list.isLoading ? <Loading /> : null}
      <ErrorMessage error={list.error ?? update.error} />

      <div>
        <ul aria-label="Conversations">
          {list.items.map((c) => (
            <li key={c.id}>
              <button type="button" aria-current={c.id === activeId} onClick={() => setActiveId(c.id)}>
                <strong>{c.userName ?? 'Customer'}</strong> · {c.mode === 'ai' ? 'with assistant' : 'with team'} — {c.lastMessagePreview}
              </button>{' '}
              <small>{formatDate(c.lastMessageAt, true)}</small>
            </li>
          ))}
        </ul>
        {!list.isLoading && list.items.length === 0 ? <p>No {status} conversations.</p> : null}
        <LoadMore hasNextPage={!!list.hasNextPage} isFetchingNextPage={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()} />

        {active ? (
          <div>
            <h2>{active.userName ?? 'Customer'}</h2>
            {canReply ? (
              <button
                type="button"
                disabled={update.isPending}
                onClick={() => update.mutate({ id: active.id, patch: { status: active.status === 'open' ? 'resolved' : 'open' } })}
              >
                {active.status === 'open' ? 'Mark resolved' : 'Reopen'}
              </button>
            ) : null}
            {canReply ? <ChatThread conversation={active} staff /> : <p>You can read this conversation but not reply.</p>}
          </div>
        ) : null}
      </div>
    </div>
  )
}
