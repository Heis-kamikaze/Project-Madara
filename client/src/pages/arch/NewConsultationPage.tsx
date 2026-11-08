import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateConsultation } from '../api/consultations'
import { uploadReferenceImage } from '../api/media'
import ErrorMessage from '../components/ui/ErrorMessage'
import Field from '../components/ui/Field'
import ImageUploader from '../components/ui/ImageUploader'
import { usePageTitle } from '../hooks/usePageTitle'
import { fromLocalInput } from '../lib/format'
import type { ConsultationType } from '../types/api'

interface MeasurementRow {
  id: number
  name: string
  value: string
}

/** Booking form for custom pieces, measurements and fittings. */
export default function NewConsultationPage() {
  usePageTitle('Book a consultation')
  const navigate = useNavigate()
  const create = useCreateConsultation()
  const [type, setType] = useState<ConsultationType>('custom_piece')
  const [slot, setSlot] = useState('')
  const [notes, setNotes] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [rows, setRows] = useState<MeasurementRow[]>([])
  const [nextId, setNextId] = useState(1)

  function addRow() {
    setRows((r) => [...r, { id: nextId, name: '', value: '' }])
    setNextId((n) => n + 1)
  }
  const updateRow = (id: number, patch: Partial<MeasurementRow>) => setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const requestedSlot = fromLocalInput(slot)
    if (!requestedSlot) return
    const measurements: Record<string, number> = {}
    for (const row of rows) {
      const n = Number(row.value)
      if (row.name.trim() && n > 0) measurements[row.name.trim()] = n
    }
    const res = await create.mutateAsync({
      type,
      requestedSlot,
      notes: notes.trim() || undefined,
      measurements: Object.keys(measurements).length > 0 ? measurements : undefined,
      referenceImageUrls: images,
    })
    navigate(`/account/consultations/${res.data.id}`)
  }

  return (
    <section>
      <h1>Book a consultation</h1>
      <p>For custom measurements, fittings, or any change to a colour or design. Pieces in a collection cannot be altered; a custom piece is made just for you.</p>
      <form onSubmit={onSubmit}>
        <Field label="What is this for?">
          <select value={type} onChange={(e) => setType(e.target.value as ConsultationType)}>
            <option value="custom_piece">A custom piece</option>
            <option value="measurements">Taking measurements</option>
            <option value="fitting">A fitting</option>
            <option value="general">Something else</option>
          </select>
        </Field>
        <Field label="Preferred date and time" hint="We will confirm the final time with you">
          <input type="datetime-local" value={slot} onChange={(e) => setSlot(e.target.value)} required />
        </Field>
        <Field label="Tell us about it">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={5} />
        </Field>

        <fieldset>
          <legend>Measurements in centimetres (optional)</legend>
          {rows.map((row) => (
            <div key={row.id}>
              <input aria-label="Measurement name" placeholder="e.g. Bust" value={row.name} onChange={(e) => updateRow(row.id, { name: e.target.value })} maxLength={40} />
              <input aria-label="Value in cm" type="number" min={1} max={500} step="0.1" value={row.value} onChange={(e) => updateRow(row.id, { value: e.target.value })} />
              <button type="button" onClick={() => setRows((r) => r.filter((x) => x.id !== row.id))}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addRow}>
            Add a measurement
          </button>
        </fieldset>

        <ImageUploader label="Inspiration or reference images (optional)" value={images} onChange={setImages} upload={uploadReferenceImage} max={8} />

        <button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Sending…' : 'Request consultation'}
        </button>
        <ErrorMessage error={create.error} />
      </form>
    </section>
  )
}
