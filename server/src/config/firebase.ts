import { type App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { env } from './env';

function init(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  try {
    return initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY,
      }),
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      '\nCould not initialise Firebase.\n' +
        '  • Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env\n' +
        '  • The private key must keep its quotes and its \\n sequences exactly as in the downloaded JSON file.\n' +
        `  • Details: ${(err as Error).message}\n`,
    );
    process.exit(1);
  }
}

const app = init();

export const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });

export const adminAuth = getAuth(app);
export const bucket = getStorage(app).bucket();

export { FieldValue, Timestamp, AggregateField } from 'firebase-admin/firestore';
