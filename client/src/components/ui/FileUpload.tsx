import { useState, type ChangeEvent } from 'react'
import { errorMessage } from '../../lib/api'
import type { UploadedFile } from '../../types/api'

interface Props {
  label: string
  accept: string
  upload: (file: File) => Promise<UploadedFile>
  onUploaded: (url: string) => void
}

/** Single-file picker (e.g. the landing-page video). */
export default function FileUpload({ label, accept, upload, onUploaded }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      onUploaded((await upload(file)).url)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <label>
      <span>{label}</span>
      <input type="file" accept={accept} disabled={busy} onChange={onFile} />
      {busy ? <small role="status">Uploading…</small> : null}
      {error ? <small role="alert">{error}</small> : null}
    </label>
  )
}
