import { randomUUID } from 'crypto';
import { bucket } from '../config/firebase';

function downloadUrl(path: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

export interface StoredFile {
  path: string;
  url: string;
  contentType: string;
}

/** Uploads a local file (e.g. a multer temp file) and returns a tokenised public URL. */
export async function uploadLocalFile(localPath: string, destination: string, contentType: string): Promise<StoredFile> {
  const token = randomUUID();
  await bucket.upload(localPath, {
    destination,
    metadata: { contentType, cacheControl: 'public, max-age=31536000', metadata: { firebaseStorageDownloadTokens: token } },
  });
  return { path: destination, url: downloadUrl(destination, token), contentType };
}

/** Uploads an in-memory buffer (e.g. a generated QR code). */
export async function uploadBuffer(buffer: Buffer, destination: string, contentType: string): Promise<StoredFile> {
  const token = randomUUID();
  await bucket.file(destination).save(buffer, {
    resumable: false,
    metadata: { contentType, cacheControl: 'public, max-age=31536000', metadata: { firebaseStorageDownloadTokens: token } },
  });
  return { path: destination, url: downloadUrl(destination, token), contentType };
}

export async function deleteFile(path: string): Promise<void> {
  await bucket.file(path).delete({ ignoreNotFound: true });
}
