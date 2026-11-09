import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useConversationMessages, useRequestHuman, useSendSupportMessage } from '../../api/support'
import { timeAgo } from '../../lib/swatch'
import type { SupportConversation } from '../../types/api'
import { IconSend } from '../icons'
import ErrorMessage from '../ui/ErrorMessage'
import Loading from '../ui/Loading'

interface Props {
  conversation: SupportConversation
  /** Staff view: labels the customer by name and hides the "talk to a person" button. */
  staff?: boolean
  /** `dark` for the Help Concierge card, `light` inside the admin tools. */
  tone?: 'dark' | 'light'
}

const LABEL: Record<string, string> = { user: 'You', agent: 'Aradam team', ai: 'Assistant', system: '' }

/** One support conversation: message history (refreshed every few seconds) and a reply box. */
export default function ChatThread({ conversation, staff = false, tone = 'dark' }: Props) {
  const { data: messages, isLoading, error } = useConversationMessages(conversation.id)
  const send = useSendSupportMessage()
  const handoff = useRequestHuman()
  const [text, setText] = useState('')
  const listRef = useRef<HTMLOListElement>(null)
  const dark = tone === 'dark'

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages?.length])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    await send.mutateAsync({ id: conversation.id, text: value })
    setText('')
  }

  // "Mine" = the sender is the person looking at the screen.
  const isMine = (sender: string) => (staff ? sender === 'agent' : sender === 'user')
  const label = (sender: string) => (staff && sender === 'user' ? (conversation.userName ?? 'Customer') : (LABEL[sender] ?? sender))

  const theirs = dark ? 'self-start bg-white/10 text-bg' : 'self-start bg-bg-alt text-ink'
  const mine = dark ? 'self-end bg-gold-light text-espresso' : 'self-end bg-ink text-bg'

  return (
    <section aria-label="Conversation" className="flex flex-col gap-3">
      {isLoading ? <Loading /> : null}
      <ErrorMessage error={error} />
      <ol ref={listRef} aria-live="polite" className="flex max-h-[44dvh] min-h-24 flex-col gap-2 overflow-y-auto pr-1">
        {messages?.map((m) => (
          <li
            key={m.id}
            data-sender={m.sender}
            data-anim="message"
            className={`max-w-[80%] rounded-[14px] px-3.5 py-2.5 text-[12px] leading-relaxed ${m.sender === 'system' ? `self-center text-center text-[10.5px] italic ${dark ? 'text-white/55' : 'text-ink-faint'}` : isMine(m.sender) ? mine : theirs}`}
          >
            {m.sender !== 'system' && !isMine(m.sender) ? <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-[0.08em] opacity-60">{label(m.sender)}</span> : null}
            {m.text}
            <time dateTime={m.createdAt} className="ml-2 text-[9px] opacity-50">
              {timeAgo(m.createdAt)}
            </time>
          </li>
        ))}
      </ol>

      <form onSubmit={onSubmit} className="!flex-row items-center !gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          placeholder={staff ? 'Reply…' : 'Type your message…'}
          aria-label={staff ? 'Reply' : 'Message'}
          className={`!rounded-full !border-0 !py-2.5 ${dark ? '!bg-white/10 !text-bg placeholder:!text-white/50' : ''}`}
          required
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={send.isPending}
          className={`flex size-8 flex-none items-center justify-center rounded-full ${dark ? 'bg-gold-light text-espresso' : 'bg-ink text-bg'}`}
        >
          <IconSend className="size-3.5" />
        </button>
      </form>

      {!staff && conversation.mode === 'ai' ? (
        <button
          type="button"
          disabled={handoff.isPending}
          onClick={() => handoff.mutate(conversation.id)}
          className={`self-start text-[11px] underline underline-offset-4 ${dark ? 'text-white/70' : 'text-ink-soft'}`}
        >
          Talk to a person
        </button>
      ) : null}
      <ErrorMessage error={send.error ?? handoff.error} />
    </section>
  )
}
