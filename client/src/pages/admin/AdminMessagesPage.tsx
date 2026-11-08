import { useState, type FormEvent } from 'react'
import { useSendMessage } from '../../api/inbox'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Field from '../../components/ui/Field'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { InboxType } from '../../types/api'

/** Send a customer a message (production update, fitting appointment…). It is also emailed to them. */
export default function AdminMessagesPage() {
  usePageTitle('Messages · Admin')
  const send = useSendMessage()
  const [userId, setUserId] = useState('')
  const [type, setType] = useState<InboxType>('general')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')
  const [email, setEmail] = useState(true)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    await send.mutateAsync({
      userId: userId.trim(),
      type,
      title: title.trim(),
      body: body.trim(),
      link: link.trim() || undefined,
      mirrorToEmail: email,
    })
    setTitle('')
    setBody('')
    setLink('')
  }

  return (
    <div>
      <h1>Message a customer</h1>
      <form onSubmit={onSubmit}>
        <Field label="Customer id">
          <input value={userId} onChange={(e) => setUserId(e.target.value)} required />
        </Field>
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value as InboxType)}>
            <option value="general">General</option>
            <option value="production">Production update</option>
            <option value="consultation">Fitting / consultation</option>
            <option value="order">Order</option>
          </select>
        </Field>
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
        </Field>
        <Field label="Message">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={5} required />
        </Field>
        <Field label="Link inside the site (optional)" hint="Starts with /, e.g. /closet">
          <input value={link} onChange={(e) => setLink(e.target.value)} maxLength={200} pattern="/.*" />
        </Field>
        <label>
          <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Also send by email
        </label>
        <button type="submit" disabled={send.isPending}>
          {send.isPending ? 'Sending…' : 'Send'}
        </button>
        {send.isSuccess ? <p role="status">Sent.</p> : null}
        <ErrorMessage error={send.error} />
      </form>
    </div>
  )
}
