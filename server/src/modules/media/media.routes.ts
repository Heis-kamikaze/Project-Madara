import { randomUUID } from 'crypto';
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
import { deleteFile, uploadLocalFile } from '../../lib/storage';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { strictLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';

const router = Router();
router.use(authenticate);

const EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};
const isImage = (mime: string) => mime.startsWith('image/');

const FOLDERS = ['products', 'collections', 'museum', 'team', 'landing', 'community'] as const;
const VIDEO_FOLDERS: readonly string[] = ['landing', 'community', 'museum'];

const staffUpload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype in EXT),
});

const customerUpload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, isImage(file.mimetype) && file.mimetype in EXT),
});

const folderQuery = z.object({ folder: z.enum(FOLDERS) });

/** Staff: upload a product photo, collection cover art, landing-page video, portrait, etc. */
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
      if (!isImage(file.mimetype) && !VIDEO_FOLDERS.includes(folder)) {
        throw badRequest(`Videos are not accepted in "${folder}"`, undefined, 'VIDEO_NOT_ALLOWED');
      }
      const dest = `${folder}/${Date.now()}-${randomUUID()}${EXT[file.mimetype]}`;
      const stored = await uploadLocalFile(file.path, dest, file.mimetype);
      audit(req.user, 'media.upload', 'media', stored.path);
      created(res, { ...stored, bytes: file.size });
    } finally {
      if (file) await fs.unlink(file.path).catch(() => undefined);
    }
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
      const dest = `consultations/${req.user!.uid}/${Date.now()}-${randomUUID()}${EXT[file.mimetype]}`;
      const stored = await uploadLocalFile(file.path, dest, file.mimetype);
      created(res, { ...stored, bytes: file.size });
    } finally {
      if (file) await fs.unlink(file.path).catch(() => undefined);
    }
  }),
);

const deleteBody = z
  .object({ path: z.string().regex(new RegExp(`^(${FOLDERS.join('|')})/[A-Za-z0-9._-]+$`), 'Not a deletable media path') })
  .strict();

router.delete(
  '/',
  requirePermission('media:upload'),
  validate({ body: deleteBody }),
  asyncHandler(async (req, res) => {
    await deleteFile(req.body.path);
    audit(req.user, 'media.delete', 'media', req.body.path);
    ok(res, { deleted: true });
  }),
);

export default router;
