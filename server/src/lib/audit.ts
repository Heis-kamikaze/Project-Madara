import { FieldValue, db } from '../config/firebase';
import type { AuthUser } from '../types/express';
import { logger } from './logger';

/** Fire-and-forget record of who changed what. Never blocks or fails a request. */
export function audit(
  actor: AuthUser | undefined,
  action: string,
  entity: string,
  entityId: string,
  meta?: Record<string, unknown>,
): void {
  db.collection('auditLogs')
    .add({
      actorUid: actor?.uid ?? null,
      actorEmail: actor?.email ?? null,
      actorRole: actor?.role ?? null,
      action,
      entity,
      entityId,
      meta: meta ?? null,
      createdAt: FieldValue.serverTimestamp(),
    })
    .catch((err) => logger.warn('Failed to write audit log', err));
}
