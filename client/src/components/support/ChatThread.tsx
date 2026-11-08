import { useState, type FormEvent } from 'react'
import { useConversationMessages, useRequestHuman, useSendSupportMessage } from '../../api/support'
import { formatDate } from '../../lib/format'
import type { SupportConversation } from '../../types/api'
import ErrorMessage from '../ui/ErrorMessage'
import Loading from '../ui/Loading'

interface Props {
  conversation: SupportConversation
  /** Staff view: labels the customer by name and hides the "talk to a person" button. */
  staff?: boolean
}

const LABEL: Record<string, string> = { user: 'You', agent: 'Aradam team', ai: 'Assistant', system: '' }

/** One support conversation: message history (refreshed every few seconds) and a reply box. */
export default function ChatThread({ conversation, staff = false }: Props) {
  const { data: messages, isLoading, error } = useConversationMessages(conversation.id)
  const send = useSendSupportMessage()
  const handoff = useRequestHuman()
  const [text, setText] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    await send.mutateAsync({ id: conversation.id, text: value })
    setText('')
  }

  const label = (sender: string) => (staff && sender === 'user' ? (conversation.userName ?? 'Customer') : (LABEL[sender] ?? sender))

  return (
    <section aria-label="Conversation">
      {isLoading ? <Loading /> : null}
      <ErrorMessage error={error} />
      <ol aria-live="polite">
        {messages?.map((m) => (
          <li key={m.id} data-sender={m.sender}>
            {label(m.sender) ? <strong>{label(m.sender)}: </strong> : null}
            <span>{m.text}</span> <time dateTime={m.createdAt}>{formatDate(m.createdAt, true)}</time>
          </li>
        ))}
      </ol>

      <form onSubmit={onSubmit}>
        <label>
          <span>{staff ? 'Reply' : 'Message'}</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} rows={3} required />
        </label>
        <button type="submit" disabled={send.isPending}>
          {send.isPending ? 'Sending…' : 'Send'}
        </button>
        {!staff && conversation.mode === 'ai' ? (
          <button type="button" disabled={handoff.isPending} onClick={() => handoff.mutate(conversation.id)}>
            Talk to a person
          </button>
        ) : null}
      </form>
      <ErrorMessage error={send.error ?? handoff.error} />
    </section>
  )
}
