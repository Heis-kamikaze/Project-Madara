import { db } from '../config/firebase';
import { describeFirebaseError } from './firebaseErrors';

export type FirestoreCheck = { ok: true; ms: number } | { ok: false; code: string; hint: string };

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(`${label} did not answer within ${ms / 1000}s`), { code: 'TIMEOUT' })), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** One tiny read. Succeeds on an empty database; fails only if Firestore itself is unusable. */
export async function checkFirestore(timeoutMs = 8000): Promise<FirestoreCheck> {
  const started = Date.now();
  try {
    await withTimeout(db.collection('_healthcheck').limit(1).get(), timeoutMs, 'Firestore');
    return { ok: true, ms: Date.now() - started };
  } catch (err) {
    if ((err as { code?: unknown }).code === 'TIMEOUT') {
      return {
        ok: false,
        code: 'DATABASE_TIMEOUT',
        hint: `No response from Firestore within ${timeoutMs / 1000}s. Check the internet connection, VPN/proxy/firewall and DNS on this machine.`,
      };
    }
    const known = describeFirebaseError(err);
    return { ok: false, code: known?.code ?? 'DATABASE_ERROR', hint: known?.hint ?? (err as Error).message };
  }
}
