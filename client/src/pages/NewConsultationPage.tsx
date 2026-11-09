import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateConsultation } from '../api/consultations'
import { uploadReferenceImage } from '../api/media'
import CalendarPicker from '../components/ui/CalendarPicker'
import ErrorMessage from '../components/ui/ErrorMessage'
import Field from '../components/ui/Field'
import ImageUploader from '../components/ui/ImageUploader'
import { usePageTitle } from '../hooks/usePageTitle'
import type { ConsultationType } from '../types/api'

interface MeasurementRow {
  id: number
  name: string
  value: string
}

const TIMES = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']
const label = (t: string) => {
  const h = Number(t.slice(0, 2))
  return `${h > 12 ? h - 12 : h}${t.slice(2) === ':00' ? '' : t.slice(2)} ${h >= 12 ? 'pm' : 'am'}`
}

/** Private Salon: calendar-first booking for custom measurements, fittings and custom pieces. */
export default function NewConsultationPage() {
  usePageTitle('Private Salon')
  const navigate = useNavigate()
  const create = useCreateConsultation()
  const [type, setType] = useState<ConsultationType>('custom_piece')
  const [day, setDay] = useState('')
  const [time, setTime] = useState('14:00')
  const [notes, setNotes] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [rows, setRows] = useState<MeasurementRow[]>([])
  const [nextId, setNextId] = useState(1)

  const slot = day ? new Date(`${day}T${time}`) : null
  const confirmLabel = slot
    ? `Confirm ${new Intl.DateTimeFormat('en-NG', { month: 'short', day: 'numeric' }).format(slot)}, ${label(time)}`
    : 'Choose a date'

  function addRow() {
    setRows((r) => [...r, { id: nextId, name: '', value: '' }])
    setNextId((n) => n + 1)
  }
  const updateRow = (id: number, patch: Partial<MeasurementRow>) => setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!slot) return
    const measurements: Record<string, number> = {}
    for (const row of rows) {
      const n = Number(row.value)
      if (row.name.trim() && n > 0) measurements[row.name.trim()] = n
    }
    const res = await create.mutateAsync({
      type,
      requestedSlot: slot.toISOString(),
      notes: notes.trim() || undefined,
      measurements: Object.keys(measurements).length > 0 ? measurements : undefined,
      referenceImageUrls: images,
    })
    navigate(`/account/consultations/${res.data.id}`)
  }

  return (
    <section className="pt-2 lg:mx-auto lg:max-w-xl lg:pt-6">
      <p className="eyebrow">Private Salon</p>
      <h1 data-anim="reveal" className="mb-2 mt-2 font-serif text-[22px] lg:text-[32px]">
        Book a Consultation
      </h1>
      <p className="mb-5 text-[12px] leading-relaxed text-ink-soft">For custom measurements, fittings, or any change to a colour or design. Pieces in a collection cannot be altered; a custom piece is made just for you.</p>

      <form onSubmit={onSubmit}>
        <Field label="What is this for?">
          <select value={type} onChange={(e) => setType(e.target.value as ConsultationType)}>
            <option value="custom_piece">A custom piece</option>
            <option value="measurements">Taking measurements</option>
            <option value="fitting">A fitting</option>
            <option value="general">Something else</option>
          </select>
        </Field>

        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-soft">Preferred date</p>
          <CalendarPicker value={day} onChange={setDay} />
        </div>

        <fieldset>
          <legend>Preferred time</legend>
          <div className="flex flex-wrap gap-2">
            {TIMES.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={time === t}
                onClick={() => setTime(t)}
                className={`rounded-full border px-3.5 py-1.5 text-[11.5px] ${time === t ? 'border-ink bg-ink text-bg' : 'border-line text-ink-soft hover:bg-bg-alt'}`}
              >
                {label(t)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">We will confirm the final time with you.</p>
        </fieldset>

        <Field label="Measurement notes" hint="Optional — tell us anything specific">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={4} />
        </Field>

        <fieldset>
          <legend>Measurements in centimetres (optional)</legend>
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-2">
                <input aria-label="Measurement name" placeholder="e.g. Bust" value={row.name} onChange={(e) => updateRow(row.id, { name: e.target.value })} maxLength={40} />
                <input aria-label="Value in cm" type="number" min={1} max={500} step="0.1" value={row.value} onChange={(e) => updateRow(row.id, { value: e.target.value })} className="!w-28" />
                <button type="button" onClick={() => setRows((r) => r.filter((x) => x.id !== row.id))}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addRow} className="mt-2">
            Add a measurement
          </button>
        </fieldset>

        <ImageUploader label="Inspiration or reference images (optional)" value={images} onChange={setImages} upload={uploadReferenceImage} max={8} />

        <button type="submit" disabled={create.isPending || !slot} className="btn btn-block">
          {create.isPending ? 'Sending…' : confirmLabel}
        </button>
        <ErrorMessage error={create.error} />
      </form>
    </section>
  )
}
