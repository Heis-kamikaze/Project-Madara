import { useState, type ChangeEvent } from 'react'
import { errorMessage } from '../../lib/api'
import type { UploadedFile } from '../../types/api'

interface Props {
  value: string[]
  onChange: (urls: string[]) => void
  upload: (file: File) => Promise<UploadedFile>
  max?: number
  label?: string
}

/** Multi-image picker: uploads each file to the API and keeps the returned URLs. */
export default function ImageUploader({ value, onChange, upload, max = 8, label = 'Images' }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, Math.max(0, max - value.length))
    e.target.value = ''
    if (files.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const uploaded = await Promise.all(files.map((f) => upload(f)))
      onChange([...value, ...uploaded.map((u) => u.url)])
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <fieldset>
      <legend>{label}</legend>
      <ul>
        {value.map((url) => (
          <li key={url}>
            <img src={url} alt="" width={96} height={96} />
            <button type="button" onClick={() => onChange(value.filter((u) => u !== url))}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={busy || value.length >= max} onChange={onFiles} />
      {busy ? <p role="status">Uploading…</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </fieldset>
  )
}
