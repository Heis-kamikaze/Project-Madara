import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCollection, useCreateCollection, usePublishCollection, useUpdateCollection } from '../../api/collections'
import { uploadMedia } from '../../api/media'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Field from '../../components/ui/Field'
import ImageUploader from '../../components/ui/ImageUploader'
import Loading from '../../components/ui/Loading'
import { usePageTitle } from '../../hooks/usePageTitle'
import { fromLocalInput, toLocalInput } from '../../lib/format'
import type { Collection } from '../../types/api'

function CollectionForm({ initial }: { initial: Collection | null }) {
  const navigate = useNavigate()
  const create = useCreateCollection()
  const update = useUpdateCollection()
  const publish = usePublishCollection()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [story, setStory] = useState(initial?.story ?? '')
  const [cover, setCover] = useState<string[]>(initial?.coverImageUrl ? [initial.coverImageUrl] : [])
  const [from, setFrom] = useState(toLocalInput(initial?.availableFrom))
  const [until, setUntil] = useState(toLocalInput(initial?.availableUntil))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const body = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      story: story.trim(),
      coverImageUrl: cover[0] ?? null,
      availableFrom: fromLocalInput(from),
      availableUntil: fromLocalInput(until),
    }
    if (initial) await update.mutateAsync({ id: initial.id, patch: body })
    else await create.mutateAsync(body)
    navigate('/admin/collections')
  }

  async function onPublish() {
    if (!initial) return
    await publish.mutateAsync(initial.id)
    navigate('/admin/collections')
  }

  const pending = create.isPending || update.isPending

  return (
    <div>
      <p>
        <Link to="/admin/collections">← Collections</Link>
      </p>
      <h1>{initial ? `Edit “${initial.title}”` : 'New collection'}</h1>
      <form onSubmit={onSubmit}>
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
        </Field>
        <Field label="URL name (optional)" hint="Lowercase letters, numbers and hyphens. Generated from the title if blank.">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} maxLength={80} pattern="[a-z0-9\-]+" />
        </Field>
        <Field label="Story">
          <textarea value={story} onChange={(e) => setStory(e.target.value)} maxLength={10000} rows={6} />
        </Field>
        <ImageUploader label="Cover art" value={cover} onChange={(urls) => setCover(urls.slice(-1))} upload={(f) => uploadMedia('collections', f)} max={1} />
        <Field label="Available from">
          <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="Available until" hint="When this time passes, the collection is archived automatically.">
          <input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
        </Field>
        <button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save'}
        </button>
        {initial?.status === 'draft' ? (
          <button type="button" disabled={publish.isPending} onClick={() => void onPublish()}>
            Publish now
          </button>
        ) : null}
      </form>
      <ErrorMessage error={create.error ?? update.error ?? publish.error} />
    </div>
  )
}

export default function AdminCollectionFormPage() {
  const { id } = useParams()
  const existing = useCollection(id)
  usePageTitle(id ? 'Edit collection · Admin' : 'New collection · Admin')

  if (id && existing.isLoading) return <Loading />
  if (id && (existing.error || !existing.data)) return <ErrorMessage error={existing.error ?? new Error('Collection not found')} />
  return <CollectionForm key={id ?? 'new'} initial={existing.data?.collection ?? null} />
}
