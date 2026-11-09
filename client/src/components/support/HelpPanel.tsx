import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useMyConversations, useStartConversation } from '../../api/support'
import { useAuth } from '../../auth/useAuth'
import { timeAgo } from '../../lib/swatch'
import ErrorMessage from '../ui/ErrorMessage'
import Loading from '../ui/Loading'
import ChatThread from './ChatThread'

/** The concierge conversation UI. Rendered inside the Help overlay and on the /support page. Always on a dark card. */
export default function HelpPanel({ initialMessage = '' }: { initialMessage?: string }) {
  const { status } = useAuth()
  const location = useLocation()
  const signedIn = status === 'signedIn'
  const conversations = useMyConversations(signedIn)
  const start = useStartConversation()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [text, setText] = useState(initialMessage)

  if (status === 'loading') return <Loading />
  if (!signedIn) {
    const next = encodeURIComponent(location.pathname + location.search)
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[12px] leading-relaxed text-white/70">The concierge is for members. Sign in to chat with the atelier about an order, a piece or a fitting.</p>
        <Link to={`/login?next=${next}`} className="btn btn-gold btn-block">
          Sign in
        </Link>
        <Link to={`/register?next=${next}`} className="text-center text-[11px] text-white/70 underline underline-offset-4">
          Create an account
        </Link>
      </div>
    )
  }

  const active = conversations.items.find((c) => c.id === activeId)

  async function onStart(e: FormEvent) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    const res = await start.mutateAsync(value)
    setActiveId(res.data.conversation.id)
    setText('')
  }

  if (active) {
    return (
      <div className="flex flex-col gap-3">
        <button type="button" onClick={() => setActiveId(null)} className="self-start text-[11px] text-white/70 underline underline-offset-4">
          ← All conversations
        </button>
        <ChatThread conversation={active} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={onStart} className="!gap-3">
        <label className="sr-only">
          <span>How can we help?</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          rows={3}
          required
          placeholder="How can the atelier help today?"
          aria-label="How can we help?"
          className="!rounded-[14px] !border-white/10 !bg-white/10 !text-bg placeholder:!text-white/50"
        />
        <button type="submit" disabled={start.isPending} className="btn btn-gold btn-block">
          {start.isPending ? 'Sending…' : 'Start a conversation'}
        </button>
        <ErrorMessage error={start.error} />
      </form>

      {conversations.isLoading ? <Loading /> : null}
      {conversations.items.length > 0 ? (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">Your conversations</p>
          <ul className="divide-y divide-white/10">
            {conversations.items.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setActiveId(c.id)} className="flex w-full items-baseline justify-between gap-3 py-2.5 text-left text-[12px] text-bg">
                  <span className="truncate">{c.lastMessagePreview}</span>
                  <span className="flex-none text-[10px] text-white/50">{timeAgo(c.lastMessageAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
