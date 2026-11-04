import type { RequestHandler } from 'express';
import { type Permission, type Role, hasPermission } from '../config/permissions';
import { forbidden, unauthorized } from '../lib/errors';

/** Caller must hold EVERY listed permission. Use after `authenticate`. */
export const requirePermission =
  (...permissions: Permission[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    const allowed = permissions.every((p) => hasPermission(req.user!.role, p));
    if (!allowed) return next(forbidden('Your role does not allow this action', 'INSUFFICIENT_PERMISSION'));
    next();
  };

/** Caller must have one of the listed roles. */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden('Your role does not allow this action', 'INSUFFICIENT_ROLE'));
    next();
  };

/** Non-middleware helper for services/handlers that branch on a permission. */
export const can = (user: { role: Role } | undefined, permission: Permission): boolean =>
  !!user && hasPermission(user.role, permission);
