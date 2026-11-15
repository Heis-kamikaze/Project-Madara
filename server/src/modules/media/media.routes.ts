import { promises as fs } from 'fs';
import os from 'os';
import multer from 'multer';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env';
import { asyncHandler } from '../../lib/asyncHandler';
import { audit } from '../../lib/audit';
import { badRequest } from '../../lib/errors';
import { created, ok } from '../../lib/response';
import { buildPublicId, deleteAsset, newAssetName, signUpload, uploadLocalFile } from '../../lib/storage';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { strictLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';

const router = Router();
router.use(authenticate);

const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm']);
const isImage = (mime: string) => mime.startsWith('image/');

const FOLDERS = ['products', 'collections', 'museum', 'team', 'landing', 'community'] as const;
const VIDEO_FOLDERS: readonly string[] = ['landing', 'community', 'museum'];

const staffUpload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, ACCEPTED.has(file.mimetype)),
});

const customerUpload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, isImage(file.mimetype) && ACCEPTED.has(file.mimetype)),
});

const folderQuery = z.object({ folder: z.enum(FOLDERS) });

/**
 * Staff: upload a product photo, collection cover art, portrait… through the API (images up to MAX_UPLOAD_MB).
 * For video, prefer POST /media/sign so the file goes straight to Cloudinary.
 */
router.post(
  '/upload',
  requirePermission('media:upload'),
  validate({ query: folderQuery }),
  staffUpload.single('file'),
  asyncHandler(async (req, res) => {
    const file = req.file;
    try {
      if (!file) throw badRequest('Attach an image or video in the "file" field (jpeg, png, webp, avif, mp4, webm)', undefined, 'FILE_REQUIRED');
      const { folder } = req.query as unknown as z.infer<typeof folderQuery>;
      const type = isImage(file.mimetype) ? 'image' : 'video';
      if (type === 'video' && !VIDEO_FOLDERS.includes(folder)) {
        throw badRequest(`Videos are not accepted in "${folder}"`, undefined, 'VIDEO_NOT_ALLOWED');
      }
      const stored = await uploadLocalFile(file.path, buildPublicId(folder, newAssetName()), type, file.mimetype);
      audit(req.user, 'media.upload', 'media', stored.path);
      created(res, stored);
    } finally {
      if (file) await fs.unlink(file.path).catch(() => undefined);
    }
  }),
);

const signBody = z.object({ folder: z.enum(FOLDERS), resourceType: z.enum(['image', 'video']) }).strict();

/** Staff: a short-lived signature for a direct browser → Cloudinary upload (no size limit imposed by this server). */
router.post(
  '/sign',
  requirePermission('media:upload'),
  validate({ body: signBody }),
  asyncHandler(async (req, res) => {
    const { folder, resourceType } = req.body as z.infer<typeof signBody>;
    if (resourceType === 'video' && !VIDEO_FOLDERS.includes(folder)) {
      throw badRequest(`Videos are not accepted in "${folder}"`, undefined, 'VIDEO_NOT_ALLOWED');
    }
    const signed = signUpload([folder], resourceType);
    audit(req.user, 'media.sign', 'media', signed.publicId);
    ok(res, signed);
  }),
);

/** Customers: attach reference images (inspiration, sketches) to a consultation request. */
router.post(
  '/reference-image',
  strictLimiter,
  customerUpload.single('file'),
  asyncHandler(async (req, res) => {
    const file = req.file;
    try {
      if (!file) throw badRequest('Attach an image (jpeg, png, webp or avif, max 5 MB) in the "file" field', undefined, 'FILE_REQUIRED');
      const stored = await uploadLocalFile(file.path, buildPublicId('consultations', req.user!.uid, newAssetName()), 'image', file.mimetype);
      created(res, stored);
    } finally {
      if (file) await fs.unlink(file.path).catch(() => undefined);
    }
  }),
);

const deleteBody = z
  .object({ path: z.string().regex(new RegExp(`^${env.CLOUDINARY_FOLDER}/(${FOLDERS.join('|')})/[A-Za-z0-9._-]+$`), 'Not a deletable media path') })
  .strict();

router.delete(
  '/',
  requirePermission('media:upload'),
  validate({ body: deleteBody }),
  asyncHandler(async (req, res) => {
    const deleted = await deleteAsset(req.body.path);
    audit(req.user, 'media.delete', 'media', req.body.path);
    ok(res, { deleted });
  }),
);

export default router;
