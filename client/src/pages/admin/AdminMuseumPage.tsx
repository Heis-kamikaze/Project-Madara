import { useState, type FormEvent } from 'react'
import { uploadMedia } from '../../api/media'
import { useCreateMuseumEntry, useDeleteMuseumEntry, useMuseum, useUpdateMuseumEntry, type MuseumInput } from '../../api/museum'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Field from '../../components/ui/Field'
import ImageUploader from '../../components/ui/ImageUploader'
import Loading from '../../components/ui/Loading'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { MuseumEntry } from '../../types/api'

function MuseumForm({ initial, onDone }: { initial: MuseumEntry | null; onDone: () => void }) {
  const create = useCreateMuseumEntry()
  const update = useUpdateMuseumEntry()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [story, setStory] = useState(initial?.story ?? '')
  const [images, setImages] = useState<string[]>(initial?.imageUrls ?? [])
  const [consent, setConsent] = useState(initial?.clientConsent ?? false)
  const [published, setPublished] = useState(initial?.published ?? false)
  const [order, setOrder] = useState(String(initial?.order ?? 0))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const body: MuseumInput = {
      title: title.trim(),
      story: story.trim(),
      imageUrls: images,
      clientConsent: consent,
      published,
      order: Math.max(0, Math.round(Number(order))),
    }
    if (initial) await update.mutateAsync({ id: initial.id, patch: body })
    else await create.mutateAsync(body)
    onDone()
  }

  return (
    <form onSubmit={onSubmit}>
      <h2>{initial ? 'Edit entry' : 'New entry'}</h2>
      <Field label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
      </Field>
      <Field label="Story">
        <textarea value={story} onChange={(e) => setStory(e.target.value)} maxLength={5000} rows={4} />
      </Field>
      <ImageUploader value={images} onChange={setImages} upload={(f) => uploadMedia('museum', f)} max={12} />
      <label>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> The client has agreed to show this piece
      </label>
      <label>
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published (needs consent and at least one image)
      </label>
      <Field label="Position" hint="Lower numbers come first">
        <input type="number" min={0} value={order} onChange={(e) => setOrder(e.target.value)} />
      </Field>
      <button type="submit" disabled={create.isPending || update.isPending}>
        Save
      </button>
      <button type="button" onClick={onDone}>
        Cancel
      </button>
      <ErrorMessage error={create.error ?? update.error} />
    </form>
  )
}

export default function AdminMuseumPage() {
  usePageTitle('Museum · Admin')
  const { data, isLoading, error } = useMuseum(true)
  const remove = useDeleteMuseumEntry()
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const current = data?.find((e) => e.id === editing) ?? null

  return (
    <div>
      <h1>Museum</h1>
      {editing ? (
        <MuseumForm key={editing} initial={current} onDone={() => setEditing(null)} />
      ) : (
        <button type="button" onClick={() => setEditing('new')}>
          New entry
        </button>
      )}
      {isLoading ? <Loading /> : null}
      <ErrorMessage error={error ?? remove.error} />
      <ul>
        {data?.map((entry) => (
          <li key={entry.id}>
            {entry.title} · {entry.published ? 'published' : 'draft'}{' '}
            <button type="button" onClick={() => setEditing(entry.id)}>
              Edit
            </button>
            <button type="button" onClick={() => window.confirm(`Delete "${entry.title}"?`) && remove.mutate(entry.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
