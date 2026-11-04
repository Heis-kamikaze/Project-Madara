import { FieldValue, adminAuth, db } from '../../config/firebase';
import { type Role, isRole } from '../../config/permissions';
import { conflict, forbidden, notFound } from '../../lib/errors';
import { snapToObject } from '../../lib/firestore';
import type { Address, UserProfile } from '../../types/models';
import type { AuthUser } from '../../types/express';

const users = db.collection('users');

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const snap = await users.doc(uid).get();
  return snap.exists ? snapToObject<UserProfile>(snap) : null;
}

/** Creates the profile document for a Firebase Auth user the first time they call the API. */
export async function ensureProfile(
  user: AuthUser,
  input: { displayName?: string; phone?: string; marketingOptIn?: boolean },
): Promise<{ profile: UserProfile; created: boolean }> {
  const ref = users.doc(user.uid);
  const existing = await ref.get();
  if (existing.exists) return { profile: snapToObject<UserProfile>(existing), created: false };

  await ref.set({
    email: user.email,
    displayName: input.displayName ?? user.name ?? null,
    phone: input.phone ?? null,
    marketingOptIn: input.marketingOptIn ?? false,
    address: null,
    role: user.role,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { profile: snapToObject<UserProfile>(await ref.get()), created: true };
}

export async function updateProfile(
  uid: string,
  patch: { displayName?: string; phone?: string | null; address?: Address | null; marketingOptIn?: boolean },
): Promise<UserProfile> {
  const ref = users.doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Profile not found. Call POST /auth/register first.', 'PROFILE_NOT_FOUND');
  await ref.update({ ...patch, updatedAt: FieldValue.serverTimestamp() });
  return snapToObject<UserProfile>(await ref.get());
}

export async function listUsers(opts: { role?: Role; limit: number; cursor?: string }) {
  if (opts.role) {
    // Equality-only query: no composite index needed; sorted in memory.
    const snaps = await users.where('role', '==', opts.role).limit(opts.limit).get();
    const items = snaps.docs
      .map((d) => snapToObject<UserProfile>(d))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return { items, nextCursor: null as string | null };
  }
  let q = users.orderBy('createdAt', 'desc');
  if (opts.cursor) {
    const c = await users.doc(opts.cursor).get();
    if (c.exists) q = q.startAfter(c);
  }
  const snaps = await q.limit(opts.limit + 1).get();
  const docs = snaps.docs.slice(0, opts.limit);
  return {
    items: docs.map((d) => snapToObject<UserProfile>(d)),
    nextCursor: snaps.docs.length > opts.limit ? docs[docs.length - 1].id : null,
  };
}

export async function getUser(uid: string): Promise<UserProfile> {
  const profile = await getProfile(uid);
  if (!profile) throw notFound('User not found');
  return profile;
}

/**
 * Assigns a role via Firebase custom claims (the source of truth the middleware reads)
 * and mirrors it on the user document. Only an `owner` may grant or revoke `owner`/`admin`.
 * The change reaches the user's token on its next refresh (≤ 1 hour, or immediately via getIdToken(true)).
 */
export async function setRole(actor: AuthUser, targetUid: string, role: Role): Promise<UserProfile> {
  if (!isRole(role)) throw forbidden('Unknown role');
  if (actor.uid === targetUid) throw forbidden('You cannot change your own role', 'SELF_ROLE_CHANGE');

  let target;
  try {
    target = await adminAuth.getUser(targetUid);
  } catch {
    throw notFound('No Firebase user with that uid');
  }

  const currentRole = isRole(target.customClaims?.role) ? (target.customClaims!.role as Role) : 'customer';
  const privileged: Role[] = ['owner', 'admin'];
  if ((privileged.includes(role) || privileged.includes(currentRole)) && actor.role !== 'owner') {
    throw forbidden('Only an owner can grant or revoke admin and owner roles', 'OWNER_ONLY');
  }
  if (currentRole === role) throw conflict(`User already has the ${role} role`, 'ROLE_UNCHANGED');

  await adminAuth.setCustomUserClaims(targetUid, { ...(target.customClaims ?? {}), role });
  await users.doc(targetUid).set(
    { email: target.email ?? null, displayName: target.displayName ?? null, role, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  return snapToObject<UserProfile>(await users.doc(targetUid).get());
}
