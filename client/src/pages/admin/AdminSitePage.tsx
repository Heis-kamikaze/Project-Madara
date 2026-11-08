import { useState, type FormEvent } from 'react'
import { useCollections } from '../../api/collections'
import { uploadMedia } from '../../api/media'
import { useLanding, useUpdateLanding } from '../../api/site'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Field from '../../components/ui/Field'
import FileUpload from '../../components/ui/FileUpload'
import Loading from '../../components/ui/Loading'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { LandingConfig } from '../../types/api'

function LandingForm({ initial }: { initial: LandingConfig }) {
  const update = useUpdateLanding()
  const collections = useCollections({ status: 'active' })
  const [headline, setHeadline] = useState(initial.headline)
  const [subheadline, setSubheadline] = useState(initial.subheadline ?? '')
  const [featured, setFeatured] = useState(initial.featuredCollectionId ?? '')
  const [video, setVideo] = useState(initial.heroVideoUrl)
  const [poster, setPoster] = useState(initial.heroPosterUrl)
  const [saved, setSaved] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaved(false)
    await update.mutateAsync({
      headline: headline.trim(),
      subheadline: subheadline.trim() || null,
      featuredCollectionId: featured || null,
      heroVideoUrl: video,
      heroPosterUrl: poster,
    })
    setSaved(true)
  }

  return (
    <form onSubmit={onSubmit}>
      <Field label="Headline">
        <input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={120} required />
      </Field>
      <Field label="Subheadline">
        <input value={subheadline} onChange={(e) => setSubheadline(e.target.value)} maxLength={240} />
      </Field>
      <Field label="Featured collection">
        <select value={featured} onChange={(e) => setFeatured(e.target.value)}>
          <option value="">None</option>
          {collections.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </Field>

      <h2>Background video</h2>
      {video ? <video src={video} poster={poster ?? undefined} muted controls width={320} /> : <p>No video set.</p>}
      <FileUpload label="Upload a video (mp4 or webm)" accept="video/mp4,video/webm" upload={(f) => uploadMedia('landing', f)} onUploaded={setVideo} />
      {video ? (
        <button type="button" onClick={() => setVideo(null)}>
          Remove video
        </button>
      ) : null}
      <FileUpload label="Poster image (shown while the video loads)" accept="image/jpeg,image/png,image/webp,image/avif" upload={(f) => uploadMedia('landing', f)} onUploaded={setPoster} />
      {poster ? <img src={poster} alt="" width={160} /> : null}

      <button type="submit" disabled={update.isPending}>
        {update.isPending ? 'Saving…' : 'Save landing page'}
      </button>
      {saved ? <p role="status">Saved.</p> : null}
      <ErrorMessage error={update.error} />
    </form>
  )
}

export default function AdminSitePage() {
  usePageTitle('Landing page · Admin')
  const { data, isLoading, error } = useLanding()
  return (
    <div>
      <h1>Landing page</h1>
      {isLoading ? <Loading /> : null}
      <ErrorMessage error={error} />
      {data ? <LandingForm initial={data} /> : null}
    </div>
  )
}
