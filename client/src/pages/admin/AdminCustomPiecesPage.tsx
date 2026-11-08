import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCreateCustomPiece, useSetClosetItemStatus } from '../../api/closet'
import { uploadMedia } from '../../api/media'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Field from '../../components/ui/Field'
import ImageUploader from '../../components/ui/ImageUploader'
import { usePageTitle } from '../../hooks/usePageTitle'

/** After a consultation: put a custom piece in the customer's closet and issue its QR code. */
export default function AdminCustomPiecesPage() {
  usePageTitle('Custom pieces · Admin')
  const [params] = useSearchParams()
  const create = useCreateCustomPiece()
  const setStatus = useSetClosetItemStatus()

  const [userId, setUserId] = useState(params.get('userId') ?? '')
  const [consultationId, setConsultationId] = useState(params.get('consultationId') ?? '')
  const [title, setTitle] = useState('')
  const [story, setStory] = useState('')
  const [notes, setNotes] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [status, setItemStatus] = useState<'in_production' | 'ready'>('in_production')

  const [uid2, setUid2] = useState('')
  const [itemId, setItemId] = useState('')
  const [status2, setStatus2] = useState<'in_production' | 'ready' | 'delivered'>('ready')

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    await create.mutateAsync({
      userId: userId.trim(),
      consultationId: consultationId.trim() || undefined,
      title: title.trim(),
      story: story.trim() || undefined,
      imageUrls: images,
      status,
      notes: notes.trim() || undefined,
    })
    setTitle('')
    setStory('')
    setNotes('')
    setImages([])
  }

  function onStatus(e: FormEvent) {
    e.preventDefault()
    setStatus.mutate({ uid: uid2.trim(), id: itemId.trim(), status: status2 })
  }

  const result = create.data?.data

  return (
    <div>
      <h1>Custom pieces</h1>

      <form onSubmit={onCreate}>
        <h2>Add a custom piece to a customer's closet</h2>
        <Field label="Customer id" hint="Shown on the consultation and on People & roles">
          <input value={userId} onChange={(e) => setUserId(e.target.value)} required />
        </Field>
        <Field label="Consultation id (optional)">
          <input value={consultationId} onChange={(e) => setConsultationId(e.target.value)} />
        </Field>
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
        </Field>
        <Field label="Story">
          <textarea value={story} onChange={(e) => setStory(e.target.value)} maxLength={5000} rows={4} />
        </Field>
        <ImageUploader label="Photos or sketches" value={images} onChange={setImages} upload={(f) => uploadMedia('products', f)} max={8} />
        <Field label="Current stage">
          <select value={status} onChange={(e) => setItemStatus(e.target.value as typeof status)}>
            <option value="in_production">In production</option>
            <option value="ready">Ready</option>
          </select>
        </Field>
        <Field label="Notes for the customer (optional)">
          <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
        </Field>
        <button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Creating…' : 'Create custom piece'}
        </button>
        <ErrorMessage error={create.error} />
      </form>

      {result ? (
        <aside role="status">
          <p>
            Created “{result.item.title}”. The customer was notified. Print this QR code for the packaging:
          </p>
          <img src={result.code.qrUrl} alt={`QR code ${result.code.code}`} width={200} />
          <p>
            <code>{result.code.code}</code> · closet item <code>{result.item.id}</code>
          </p>
        </aside>
      ) : null}

      <form onSubmit={onStatus}>
        <h2>Update a custom piece's stage</h2>
        <Field label="Customer id">
          <input value={uid2} onChange={(e) => setUid2(e.target.value)} required />
        </Field>
        <Field label="Closet item id">
          <input value={itemId} onChange={(e) => setItemId(e.target.value)} required />
        </Field>
        <Field label="New stage">
          <select value={status2} onChange={(e) => setStatus2(e.target.value as typeof status2)}>
            <option value="in_production">In production</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
          </select>
        </Field>
        <button type="submit" disabled={setStatus.isPending}>
          Update and notify customer
        </button>
        {setStatus.isSuccess ? <p role="status">Updated.</p> : null}
        <ErrorMessage error={setStatus.error} />
      </form>
    </div>
  )
}
