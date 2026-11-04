import { FieldValue, db } from '../../config/firebase';
import { notFound, conflict } from '../../lib/errors';
import { paginate, snapToObject } from '../../lib/firestore';
import { can } from '../../middleware/authorize';
import type { AuthUser } from '../../types/express';
import type { SupportConversation, SupportMessage } from '../../types/models';
import { aiAvailable, generateReply } from './ai.service';

const conversations = db.collection('supportConversations');
const messagesOf = (id: string) => conversations.doc(id).collection('messages');
const preview = (text: string) => text.replace(/\s+/g, ' ').slice(0, 120);

async function getConversation(id: string): Promise<SupportConversation> {
  const snap = await conversations.doc(id).get();
  if (!snap.exists) throw notFound('Conversation not found');
  return snapToObject<SupportConversation>(snap);
}

/** Owner or staff only. Everyone else is told the conversation does not exist. */
export async function getForUser(id: string, user: AuthUser, staffPermission: 'support:read' | 'support:reply' = 'support:read') {
  const conv = await getConversation(id);
  if (conv.userId !== user.uid && !can(user, staffPermission)) throw notFound('Conversation not found');
  return conv;
}

async function addMessage(convId: string, sender: SupportMessage['sender'], senderId: string | null, text: string, extra: Record<string, unknown> = {}) {
  const msgRef = messagesOf(convId).doc();
  const batch = db.batch();
  batch.set(msgRef, { sender, senderId, text, createdAt: FieldValue.serverTimestamp() });
  batch.update(conversations.doc(convId), { lastMessageAt: FieldValue.serverTimestamp(), lastMessagePreview: preview(text), ...extra });
  await batch.commit();
  return snapToObject<SupportMessage>(await msgRef.get());
}

async function recentHistory(convId: string, n = 12): Promise<SupportMessage[]> {
  const snaps = await messagesOf(convId).orderBy('createdAt', 'desc').limit(n).get();
  return snaps.docs.map((d) => snapToObject<SupportMessage>(d)).reverse();
}

/** Lets the AI answer; if it is unavailable or fails, hands the chat to the human team. */
async function respondWithAi(convId: string): Promise<SupportMessage> {
  const reply = await generateReply(await recentHistory(convId));
  if (reply) return addMessage(convId, 'ai', null, reply);
  return addMessage(convId, 'system', null, 'Thanks for your message. A member of the Aradam team will reply here shortly.', { mode: 'agent' });
}

export async function startConversation(user: AuthUser, text: string) {
  const mode: SupportConversation['mode'] = aiAvailable() ? 'ai' : 'agent';
  const convRef = conversations.doc();
  const msgRef = messagesOf(convRef.id).doc();
  const batch = db.batch();
  batch.set(convRef, {
    userId: user.uid,
    userName: user.name ?? user.email?.split('@')[0] ?? null,
    status: 'open',
    mode,
    assignedTo: null,
    lastMessageAt: FieldValue.serverTimestamp(),
    lastMessagePreview: preview(text),
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.set(msgRef, { sender: 'user', senderId: user.uid, text, createdAt: FieldValue.serverTimestamp() });
  await batch.commit();

  const messages = [snapToObject<SupportMessage>(await msgRef.get())];
  messages.push(
    mode === 'ai'
      ? await respondWithAi(convRef.id)
      : await addMessage(convRef.id, 'system', null, 'Thanks for reaching out. A member of the Aradam team will reply here shortly.'),
  );
  return { conversation: await getConversation(convRef.id), messages };
}

export async function postMessage(user: AuthUser, convId: string, text: string): Promise<SupportMessage[]> {
  const conv = await getForUser(convId, user, 'support:reply');
  const isOwner = conv.userId === user.uid;

  if (isOwner) {
    const created: SupportMessage[] = [await addMessage(convId, 'user', user.uid, text, { status: 'open' })];
    if (conv.mode === 'ai') created.push(await respondWithAi(convId));
    return created;
  }
  // Staff reply: claim the conversation if nobody has it yet and switch it to human mode.
  return [await addMessage(convId, 'agent', user.uid, text, { status: 'open', mode: 'agent', assignedTo: conv.assignedTo ?? user.uid })];
}

export async function requestHuman(user: AuthUser, convId: string): Promise<SupportMessage> {
  const conv = await getConversation(convId);
  if (conv.userId !== user.uid) throw notFound('Conversation not found');
  if (conv.mode === 'agent') throw conflict('You are already chatting with the team', 'ALREADY_HUMAN');
  return addMessage(convId, 'system', null, 'You asked for a person. A member of the Aradam team will reply here shortly.', { mode: 'agent', status: 'open' });
}

export async function getMessages(user: AuthUser, convId: string, opts: { afterId?: string; limit: number }) {
  await getForUser(convId, user, 'support:read');
  let q = messagesOf(convId).orderBy('createdAt', 'asc');
  if (opts.afterId) {
    const after = await messagesOf(convId).doc(opts.afterId).get();
    if (after.exists) q = q.startAfter(after);
  }
  const snaps = await q.limit(opts.limit).get();
  return snaps.docs.map((d) => snapToObject<SupportMessage>(d));
}

export function listMine(uid: string, limit: number, cursor?: string) {
  return paginate<SupportConversation>(conversations.where('userId', '==', uid).orderBy('lastMessageAt', 'desc'), conversations, limit, cursor);
}

export function listAll(opts: { status?: 'open' | 'resolved'; limit: number; cursor?: string }) {
  const base = opts.status ? conversations.where('status', '==', opts.status) : conversations;
  return paginate<SupportConversation>(base.orderBy('lastMessageAt', 'desc'), conversations, opts.limit, opts.cursor);
}

export async function staffUpdate(id: string, patch: { status?: 'open' | 'resolved'; assignedTo?: string | null }): Promise<SupportConversation> {
  await getConversation(id);
  await conversations.doc(id).update({ ...patch });
  return getConversation(id);
}
