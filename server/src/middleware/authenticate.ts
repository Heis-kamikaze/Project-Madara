import type { Request } from 'express';
import { adminAuth } from '../config/firebase';
import { isRole } from '../config/permissions';
import { asyncHandler } from '../lib/asyncHandler';
import { unauthorized } from '../lib/errors';
import type { AuthUser } from '../types/express';

async function resolveUser(req: Request): Promise<AuthUser | null> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: (decoded.name as string | undefined) ?? null,
      emailVerified: decoded.email_verified === true,
      role: isRole(decoded.role) ? decoded.role : 'customer',
    };
  } catch {
    throw unauthorized('Invalid or expired token', 'INVALID_TOKEN');
  }
}

/** Requires a valid Firebase ID token (`Authorization: Bearer <token>`). */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const user = await resolveUser(req);
  if (!user) throw unauthorized();
  req.user = user;
  next();
});

/** Attaches `req.user` when a token is present, otherwise continues anonymously. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const user = await resolveUser(req);
  if (user) req.user = user;
  next();
});
