import { env } from '../config/env';

export interface FirebaseFailure {
  /** HTTP status the API answers with. */
  status: number;
  /** Stable machine-readable code for logs and the frontend. */
  code: string;
  /** Plain-English cause and fix. Shown in development and in logs, never to customers. */
  hint: string;
}

/**
 * Firestore (gRPC) errors carry a numeric `code`. The ones below are infrastructure/setup
 * problems, not bugs in a request, so they get a precise explanation instead of a 100-line stack trace.
 */
export function describeFirebaseError(err: unknown): FirebaseFailure | null {
  const code = (err as { code?: unknown } | null)?.code;
  if (typeof code !== 'number') return null;
  const message = String((err as Error).message ?? '');

  switch (code) {
    case 5: // NOT_FOUND: the DATABASE does not exist (a missing collection/document never raises this)
      return {
        status: 503,
        code: 'DATABASE_NOT_FOUND',
        hint:
          `Firestore reached Google but found no database for project "${env.FIREBASE_PROJECT_ID}". ` +
          'Create it: Firebase console → Build → Firestore Database → Create database (Standard edition, database ID "(default)"). ' +
          'Also confirm FIREBASE_PROJECT_ID is the same project as your service-account key.',
      };
    case 7: // PERMISSION_DENIED
      return {
        status: 503,
        code: 'DATABASE_PERMISSION_DENIED',
        hint:
          'The service account was refused by Firestore. Enable the "Cloud Firestore API" for the project and make sure the key belongs to this project ' +
          `(${env.FIREBASE_PROJECT_ID}) and has the "Cloud Datastore User" (or Firebase Admin) role.`,
      };
    case 16: // UNAUTHENTICATED
      return {
        status: 503,
        code: 'DATABASE_UNAUTHENTICATED',
        hint: 'Google rejected the credentials. Re-check FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY, or generate a new service-account key. A wrong system clock can also cause this.',
      };
    case 14: // UNAVAILABLE
    case 4: // DEADLINE_EXCEEDED
      return {
        status: 503,
        code: 'DATABASE_UNREACHABLE',
        hint: 'Could not reach Firestore in time. Check the internet connection, VPN/proxy/firewall rules, and DNS on the machine running the server.',
      };
    case 9: {
      // FAILED_PRECONDITION: usually a missing composite index.
      if (!/index/i.test(message)) return null;
      const link = message.match(/https?:\/\/\S+/)?.[0];
      return {
        status: 500,
        code: 'INDEX_REQUIRED',
        hint: `A Firestore index is missing. Deploy firestore.indexes.json (firebase deploy --only firestore:indexes)${link ? `, or create it from: ${link}` : '.'}`,
      };
    }
    default:
      return null;
  }
}
