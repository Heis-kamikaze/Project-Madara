import { FieldValue, adminAuth, db } from '../../config/firebase';
import { notFound } from '../../lib/errors';
import { snapToObject } from '../../lib/firestore';
import { logger } from '../../lib/logger';
import { renderEmail, sendEmail } from '../../lib/mailer';
import { env } from '../../config/env';
import type { InboxMessage, InboxType } from '../../types/models';

const inboxOf = (uid: string) => db.collection('users').doc(uid).collection('inbox');

export interface NewMessage {
  type: InboxType;
  title: string;
  body: string;
  link?: string | null;
}

async function emailFor(uid: string): Promise<string | null> {
  const profile = await db.collection('users').doc(uid).get();
  const fromProfile = profile.data()?.email as string | undefined;
  if (fromProfile) return fromProfile;
  try {
    return (await adminAuth.getUser(uid)).email ?? null;
  } catch {
    return null;
  }
}

/**
 * Writes a message to the user's in-app inbox and mirrors it to their email
 * so nothing is missed while they are offline. Email delivery never fails the caller.
 */
export async function sendMessage(uid: string, message: NewMessage, opts: { mirrorToEmail?: boolean } = {}): Promise<string> {
  const ref = await inboxOf(uid).add({
    type: message.type,
    title: message.title,
    body: message.body,
    link: message.link ?? null,
    read: false,
    emailedAt: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  if (opts.mirrorToEmail !== false) {
    void (async () => {
      try {
        const to = await emailFor(uid);
        if (!to) return;
        const link = message.link ? `${env.APP_BASE_URL.replace(/\/$/, '')}${message.link}` : undefined;
        const { html, text } = renderEmail(message.title, message.body, link);
        const sent = await sendEmail({ to, subject: message.title, html, text });
        if (sent) await ref.update({ emailedAt: FieldValue.serverTimestamp() });
      } catch (err) {
        logger.warn('Failed to mirror inbox message to email', err);
      }
    })();
  }

  return ref.id;
}

export async function list(uid: string, opts: { unreadOnly: boolean; limit: number }): Promise<InboxMessage[]> {
  if (opts.unreadOnly) {
    const snaps = await inboxOf(uid).where('read', '==', false).limit(100).get();
    return snaps.docs
      .map((d) => snapToObject<InboxMessage>(d))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, opts.limit);
  }
  const snaps = await inboxOf(uid).orderBy('createdAt', 'desc').limit(opts.limit).get();
  return snaps.docs.map((d) => snapToObject<InboxMessage>(d));
}

export async function unreadCount(uid: string): Promise<number> {
  const agg = await inboxOf(uid).where('read', '==', false).count().get();
  return agg.data().count;
}

export async function markRead(uid: string, id: string): Promise<void> {
  const ref = inboxOf(uid).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Message not found');
  await ref.update({ read: true });
}

export async function markAllRead(uid: string): Promise<number> {
  const snaps = await inboxOf(uid).where('read', '==', false).limit(400).get();
  if (snaps.empty) return 0;
  const batch = db.batch();
  snaps.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
  return snaps.size;
}

export async function remove(uid: string, id: string): Promise<void> {
  const ref = inboxOf(uid).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Message not found');
  await ref.delete();
}
