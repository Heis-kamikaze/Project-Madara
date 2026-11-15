// import { api } from '../lib/api'
// import type { UploadedFile } from '../types/api'

// export type MediaFolder = 'products' | 'collections' | 'museum' | 'team' | 'landing' | 'community'

// /** Staff upload (needs `media:upload`). Returns the public URL to store on the record. */
// export const uploadMedia = async (folder: MediaFolder, file: File): Promise<UploadedFile> =>
//   (await api.upload<UploadedFile>('/media/upload', file, { folder })).data

// /** Customer reference image for a consultation (images only, max 5 MB). */
// export const uploadReferenceImage = async (file: File): Promise<UploadedFile> =>
//   (await api.upload<UploadedFile>('/media/reference-image', file)).data

import { ApiError, api } from '../lib/api'
import type { UploadedFile } from '../types/api'

export type MediaFolder = 'products' | 'collections' | 'museum' | 'team' | 'landing' | 'community'

/** What POST /media/sign returns: everything needed for one direct browser → Cloudinary upload. */
interface SignedUpload {
  uploadUrl: string
  apiKey: string
  signature: string
  /** Signed fields: send each one exactly as given. */
  fields: Record<string, string | number>
  resourceType: 'image' | 'video'
}

/** Adds automatic format + quality selection (f_auto,q_auto) to a Cloudinary delivery URL. */
export const optimizedUrl = (secureUrl: string): string => secureUrl.replace('/upload/', '/upload/f_auto,q_auto/')

const friendlyCloudinaryError = (message: string | undefined): string =>
  message && /file size too large/i.test(message)
    ? 'That file is larger than the media plan allows (free plan: 10 MB for images, 100 MB for video). Use a smaller file.'
    : (message ?? 'The upload failed. Please try again.')

/** Video goes straight to Cloudinary with a short-lived signature, so large files never pass through our server. */
async function uploadDirect(folder: MediaFolder, file: File): Promise<UploadedFile> {
  const { data: sig } = await api.post<SignedUpload>('/media/sign', {
    folder,
    resourceType: file.type.startsWith('video/') ? 'video' : 'image',
  })

  const form = new FormData()
  for (const [key, value] of Object.entries(sig.fields)) form.append(key, String(value))
  form.append('api_key', sig.apiKey)
  form.append('signature', sig.signature)
  form.append('file', file)

  let res: Response
  try {
    res = await fetch(sig.uploadUrl, { method: 'POST', body: form })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the media service. Check your connection and try again.')
  }

  const json = (await res.json().catch(() => null)) as { secure_url?: string; public_id?: string; bytes?: number; error?: { message?: string } } | null
  if (!res.ok || !json?.secure_url) {
    throw new ApiError(res.status || 0, 'UPLOAD_FAILED', friendlyCloudinaryError(json?.error?.message))
  }
  return { path: json.public_id ?? '', url: optimizedUrl(json.secure_url), contentType: file.type, bytes: json.bytes ?? file.size }
}

/**
 * Staff upload (needs `media:upload`). Returns the public URL to store on the record.
 * Images go through the API; video goes directly to Cloudinary.
 */
export const uploadMedia = async (folder: MediaFolder, file: File): Promise<UploadedFile> =>
  file.type.startsWith('video/') ? uploadDirect(folder, file) : (await api.upload<UploadedFile>('/media/upload', file, { folder })).data

/** Customer reference image for a consultation (images only, max 5 MB). */
export const uploadReferenceImage = async (file: File): Promise<UploadedFile> =>
  (await api.upload<UploadedFile>('/media/reference-image', file)).data
