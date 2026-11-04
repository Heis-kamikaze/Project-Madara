/**
 * One-time helper: gives an existing Firebase user a staff role.
 *
 *   npm run bootstrap:admin -- you@example.com owner
 *
 * The user must already have signed up (Firebase Auth) so that the account exists.
 * Run it once for yourself; after that, role changes happen through PATCH /users/:uid/role.
 */
import { FieldValue, adminAuth, db } from '../config/firebase';
import { ROLES, isRole } from '../config/permissions';

async function main() {
  const [email, roleArg = 'owner'] = process.argv.slice(2);
  if (!email || !isRole(roleArg)) {
    console.error(`Usage: npm run bootstrap:admin -- <email> [${ROLES.join('|')}]`);
    process.exit(1);
  }

  const user = await adminAuth.getUserByEmail(email);
  await adminAuth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role: roleArg });

  const ref = db.collection('users').doc(user.uid);
  const exists = (await ref.get()).exists;
  await ref.set(
    {
      email: user.email ?? email,
      displayName: user.displayName ?? null,
      role: roleArg,
      updatedAt: FieldValue.serverTimestamp(),
      ...(exists ? {} : { phone: null, address: null, marketingOptIn: false, createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );

  console.log(`✔ ${email} (${user.uid}) is now "${roleArg}". Ask them to sign out and back in so the new role reaches their token.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
