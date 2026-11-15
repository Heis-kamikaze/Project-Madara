/**
 * Verifies every external service the API depends on and says what to fix.
 *
 *   npm run check:services
 */
import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';
import { adminAuth } from '../config/firebase';
import { checkFirestore, withTimeout } from '../lib/firestoreCheck';
import { describeCloudinaryError } from '../lib/storage';

let failures = 0;
const pass = (name: string, detail = '') => console.log(`  ✔ ${name}${detail ? ` — ${detail}` : ''}`);
const fail = (name: string, why: string) => {
  failures += 1;
  console.log(`  ✘ ${name}\n      ${why}`);
};

async function main() {
  console.log('\nAradam — services check\n');
  console.log(`  Firebase project  ${env.FIREBASE_PROJECT_ID}`);
  console.log(`  Service account   ${env.FIREBASE_CLIENT_EMAIL}`);
  console.log(`  Cloudinary cloud  ${env.CLOUDINARY_CLOUD_NAME} (folder "${env.CLOUDINARY_FOLDER}")\n`);

  // 0. Configuration consistency (the cheapest mistake to make)
  if (env.FIREBASE_CLIENT_EMAIL.includes(`@${env.FIREBASE_PROJECT_ID}.`)) pass('Firebase project ID matches the service account');
  else fail('Firebase project ID does not match the service account', `FIREBASE_CLIENT_EMAIL belongs to a different project than FIREBASE_PROJECT_ID ("${env.FIREBASE_PROJECT_ID}"). Copy all three FIREBASE_* values from the same JSON key file.`);

  // 1. Firestore
  const fs = await checkFirestore();
  if (fs.ok) pass('Firestore', `reachable in ${fs.ms} ms`);
  else fail(`Firestore [${fs.code}]`, fs.hint);

  // 2. Firebase Authentication
  try {
    await withTimeout(adminAuth.listUsers(1), 8000, 'Firebase Authentication');
    pass('Firebase Authentication', 'can list users');
  } catch (err) {
    fail('Firebase Authentication', `${(err as Error).message}. Enable Authentication in the Firebase console (Build → Authentication → Get started) and check the service-account key.`);
  }

  // 3. Cloudinary
  try {
    const res = await withTimeout(cloudinary.api.ping(), 8000, 'Cloudinary');
    if (res.status === 'OK') pass('Cloudinary', 'credentials accepted');
    else fail('Cloudinary', `Unexpected answer: ${JSON.stringify(res)}`);
  } catch (err) {
    const { message, httpCode } = describeCloudinaryError(err);
    fail('Cloudinary', `${message}${httpCode ? ` (HTTP ${httpCode})` : ''}. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET (Cloudinary console → Settings → API Keys).`);
  }

  console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} problem(s) found. Fix them in order from the top.\n`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
