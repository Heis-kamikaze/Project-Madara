// import { randomUUID } from 'crypto';
// import { bucket } from '../config/firebase';

// function downloadUrl(path: string, token: string): string {
//   return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
// }

// export interface StoredFile {
//   path: string;
//   url: string;
//   contentType: string;
// }

// /** Uploads a local file (e.g. a multer temp file) and returns a tokenised public URL. */
// export async function uploadLocalFile(localPath: string, destination: string, contentType: string): Promise<StoredFile> {
//   const token = randomUUID();
//   await bucket.upload(localPath, {
//     destination,
//     metadata: { contentType, cacheControl: 'public, max-age=31536000', metadata: { firebaseStorageDownloadTokens: token } },
//   });
//   return { path: destination, url: downloadUrl(destination, token), contentType };
// }

// /** Uploads an in-memory buffer (e.g. a generated QR code). */
// export async function uploadBuffer(buffer: Buffer, destination: string, contentType: string): Promise<StoredFile> {
//   const token = randomUUID();
//   await bucket.file(destination).save(buffer, {
//     resumable: false,
//     metadata: { contentType, cacheControl: 'public, max-age=31536000', metadata: { firebaseStorageDownloadTokens: token } },
//   });
//   return { path: destination, url: downloadUrl(destination, token), contentType };
// }

// export async function deleteFile(path: string): Promise<void> {
//   await bucket.file(path).delete({ ignoreNotFound: true });
// }

import { randomUUID } from 'crypto';
import type { UploadApiResponse } from 'cloudinary';
import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';
import { AppError } from './errors';
import { logger } from './logger';

export type ResourceType = 'image' | 'video';

/** Source formats Cloudinary will accept; anything else is rejected at upload time. */
export const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
export const VIDEO_FORMATS = ['mp4', 'webm'];
const formatsFor = (type: ResourceType) => (type === 'video' ? VIDEO_FORMATS : IMAGE_FORMATS);

/** Every asset lives under CLOUDINARY_FOLDER, e.g. aradam/products/1731000000000-<uuid>. */
export const buildPublicId = (...segments: string[]): string => [env.CLOUDINARY_FOLDER, ...segments].join('/');
export const newAssetName = (): string => `${Date.now()}-${randomUUID()}`;

export interface StoredFile {
  /** Cloudinary public id. Keep it: it is what you pass to deleteAsset(). */
  path: string;
  /** URL to show in the site: delivered in the best format and quality for each browser (f_auto, q_auto). */
  url: string;
  /** The file exactly as uploaded. */
  originalUrl: string;
  resourceType: ResourceType;
  contentType: string;
  bytes: number;
  width?: number;
  height?: number;
  /** Seconds, for video. */
  duration?: number;
}

/** Adds automatic format + quality selection to a Cloudinary delivery URL. */
export const optimizedUrl = (secureUrl: string): string => secureUrl.replace('/upload/', '/upload/f_auto,q_auto/');

/** Cloudinary rejects with plain objects ({ message, http_code } or { error: { message, http_code } }), not Error instances. */
export function describeCloudinaryError(err: unknown): { message: string; httpCode?: number } {
  const e = ((err as { error?: unknown } | null)?.error ?? err) as { message?: string; http_code?: number } | null;
  return { message: e?.message ?? 'Unknown Cloudinary error', httpCode: e?.http_code };
}

/** Turns a Cloudinary failure into an AppError with a message the person (or developer) can act on. */
export function mapCloudinaryError(err: unknown): AppError {
  const { message, httpCode } = describeCloudinaryError(err);
  if (/file size too large/i.test(message)) {
    return new AppError(413, 'FILE_TOO_LARGE', 'That file is larger than your Cloudinary plan allows (free plan: 10 MB for images, 100 MB for video). Use a smaller file.');
  }
  if (/format|not allowed|unsupported/i.test(message)) {
    return new AppError(400, 'UNSUPPORTED_FILE', `That file type is not supported: ${message}`);
  }
  if (httpCode === 401 || httpCode === 403 || /invalid (api[ _-]?key|signature|cloud[ _-]?name|credentials)|must supply api_key|unknown api key/i.test(message)) {
    logger.error(`Cloudinary rejected the credentials: ${message}. Check CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.`);
    return new AppError(503, 'MEDIA_SERVICE_MISCONFIGURED', env.IS_PRODUCTION ? 'Media storage is temporarily unavailable.' : `Cloudinary refused the credentials: ${message}`);
  }
  logger.error(`Cloudinary request failed: ${message}`);
  return new AppError(502, 'MEDIA_UPLOAD_FAILED', 'Could not store the file right now. Please try again.');
}

function toStored(res: UploadApiResponse, contentType: string, optimize: boolean): StoredFile {
  return {
    path: res.public_id,
    url: optimize ? optimizedUrl(res.secure_url) : res.secure_url,
    originalUrl: res.secure_url,
    resourceType: res.resource_type === 'video' ? 'video' : 'image',
    contentType,
    bytes: res.bytes,
    width: res.width,
    height: res.height,
    duration: typeof res.duration === 'number' ? res.duration : undefined,
  };
}

/** Uploads a local file (e.g. a multer temp file). */
export async function uploadLocalFile(localPath: string, publicId: string, resourceType: ResourceType, contentType: string): Promise<StoredFile> {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      public_id: publicId,
      resource_type: resourceType,
      allowed_formats: formatsFor(resourceType),
      overwrite: false,
      unique_filename: false,
      use_filename: false,
    });
    return toStored(result, contentType, true);
  } catch (err) {
    throw mapCloudinaryError(err);
  }
}

/** Uploads an in-memory buffer (e.g. a generated QR code). Not optimised: QR codes stay pixel-exact PNGs for printing. */
export async function uploadBuffer(buffer: Buffer, publicId: string, opts: { resourceType?: ResourceType; contentType?: string; optimize?: boolean } = {}): Promise<StoredFile> {
  const resourceType = opts.resourceType ?? 'image';
  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { public_id: publicId, resource_type: resourceType, allowed_formats: [...formatsFor(resourceType), 'png'], overwrite: false, unique_filename: false, use_filename: false },
        (err, res) => (err || !res ? reject(err ?? new Error('Empty response from Cloudinary')) : resolve(res)),
      );
      stream.end(buffer);
    });
    return toStored(result, opts.contentType ?? 'image/png', opts.optimize ?? false);
  } catch (err) {
    throw mapCloudinaryError(err);
  }
}

/** Deletes an asset by public id. Cloudinary needs the resource type, so try image first, then video. */
export async function deleteAsset(publicId: string): Promise<boolean> {
  try {
    for (const type of ['image', 'video'] as const) {
      const res = await cloudinary.uploader.destroy(publicId, { resource_type: type, invalidate: true });
      if (res.result === 'ok') return true;
    }
    return false;
  } catch (err) {
    throw mapCloudinaryError(err);
  }
}

export interface SignedUpload {
  /** POST multipart/form-data here. */
  uploadUrl: string;
  apiKey: string;
  signature: string;
  /** Append every field to the form exactly as given (they are part of the signature). */
  fields: { public_id: string; timestamp: number; allowed_formats: string };
  resourceType: ResourceType;
  publicId: string;
}

/**
 * Lets a signed-in staff member upload straight from the browser to Cloudinary (best for video: the file never
 * passes through this server). The signature binds the public id, the allowed formats and a one-hour timestamp.
 */
export function signUpload(segments: string[], resourceType: ResourceType): SignedUpload {
  const fields = {
    public_id: buildPublicId(...segments, newAssetName()),
    timestamp: Math.round(Date.now() / 1000),
    allowed_formats: formatsFor(resourceType).join(','),
  };
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    apiKey: env.CLOUDINARY_API_KEY,
    signature: cloudinary.utils.api_sign_request(fields, env.CLOUDINARY_API_SECRET),
    fields,
    resourceType,
    publicId: fields.public_id,
  };
}
