import { Link } from 'react-router-dom'
import { useDeleteMessage, useInbox, useMarkAllRead, useMarkRead } from '../api/inbox'
import { IconArrow, IconBox, IconMail } from '../components/icons'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import { usePageTitle } from '../hooks/usePageTitle'
import { timeAgo } from '../lib/swatch'
import type { InboxType } from '../types/api'

const ICON: Record<InboxType, typeof IconMail> = {
  order: IconBox,
  production: IconArrow,
  consultation: IconMail,
  system: IconMail,
  support: IconMail,
  general: IconMail,
}

/** Consultation, pickup and delivery notices — also sent to your email. */
export default function InboxPage() {
  usePageTitle('Inbox')
  const inbox = useInbox()
  const markRead = useMarkRead()
  const markAll = useMarkAllRead()
  const remove = useDeleteMessage()
  const messages = inbox.data?.data ?? []
  const unread = typeof inbox.data?.meta?.unread === 'number' ? inbox.data.meta.unread : 0

  return (
    <section className="pt-2 lg:mx-auto lg:max-w-2xl lg:pt-6">
      <h1 className="sr-only">Inbox</h1>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-ink-faint">Also sent to your email</p>
        {unread > 0 ? (
          <button type="button" disabled={markAll.isPending} onClick={() => markAll.mutate()} className="btn btn-outline btn-sm">
            Mark all as read ({unread})
          </button>
        ) : null}
      </div>
      {inbox.isLoading ? <Loading /> : null}
      <ErrorMessage error={inbox.error ?? markRead.error ?? markAll.error ?? remove.error} />
      {!inbox.isLoading && messages.length === 0 ? <p className="mt-8 font-serif text-[15px] italic text-ink-soft">No messages yet.</p> : null}

      <ul data-anim="stagger" className="mt-2 divide-y divide-line">
        {messages.map((m) => {
          const Icon = ICON[m.type] ?? IconMail
          return (
            <li key={m.id} data-read={m.read} data-type={m.type} className="flex items-start gap-3 py-3">
              <span className={`mt-4 size-1.5 flex-none rounded-full ${m.read ? 'bg-transparent' : 'bg-gold'}`} aria-label={m.read ? undefined : 'Unread'} />
              <span className="flex size-[34px] flex-none items-center justify-center rounded-full bg-bg-alt">
                <Icon />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-[12px] font-semibold ${m.read ? 'text-ink-soft' : ''}`}>{m.title}</p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-ink-faint">{m.body}</p>
                <div className="mt-1.5 flex gap-3 text-[10.5px]">
                  {m.link ? (
                    <Link to={m.link} onClick={() => !m.read && markRead.mutate(m.id)} className="font-semibold text-gold underline underline-offset-4">
                      Open
                    </Link>
                  ) : null}
                  {!m.read ? (
                    <button type="button" className="text-ink-faint underline" onClick={() => markRead.mutate(m.id)}>
                      Mark as read
                    </button>
                  ) : null}
                  <button type="button" className="text-ink-faint underline" onClick={() => remove.mutate(m.id)}>
                    Delete
                  </button>
                </div>
              </div>
              <time dateTime={m.createdAt} className="flex-none text-[9.5px] text-ink-faint">
                {timeAgo(m.createdAt)}
              </time>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
