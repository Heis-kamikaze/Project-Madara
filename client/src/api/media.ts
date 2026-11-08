import { api } from '../lib/api'
import type { UploadedFile } from '../types/api'

export type MediaFolder = 'products' | 'collections' | 'museum' | 'team' | 'landing' | 'community'

/** Staff upload (needs `media:upload`). Returns the public URL to store on the record. */
export const uploadMedia = async (folder: MediaFolder, file: File): Promise<UploadedFile> =>
  (await api.upload<UploadedFile>('/media/upload', file, { folder })).data

/** Customer reference image for a consultation (images only, max 5 MB). */
export const uploadReferenceImage = async (file: File): Promise<UploadedFile> =>
  (await api.upload<UploadedFile>('/media/reference-image', file)).data
