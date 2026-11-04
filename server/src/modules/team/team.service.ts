import { FieldValue, db } from '../../config/firebase';
import { badRequest, notFound } from '../../lib/errors';
import { compareValues, snapToObject } from '../../lib/firestore';
import type { TeamMember } from '../../types/models';

const team = db.collection('team');

export type TeamNode = TeamMember & { children: TeamNode[] };

export interface TeamInput {
  name: string;
  title: string;
  bio: string | null;
  portraitUrl: string | null;
  parentId: string | null;
  order: number;
}

async function all(): Promise<TeamMember[]> {
  const snaps = await team.get();
  return snaps.docs.map((d) => snapToObject<TeamMember>(d)).sort((a, b) => compareValues(a.order, b.order) || a.name.localeCompare(b.name));
}

/** Flat list (for portraits) plus a nested tree (for the organisational chart). */
export async function getTeam(): Promise<{ members: TeamMember[]; tree: TeamNode[] }> {
  const members = await all();
  const nodes = new Map<string, TeamNode>(members.map((m) => [m.id, { ...m, children: [] }]));
  const tree: TeamNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else tree.push(node);
  }
  return { members, tree };
}

async function assertValidParent(id: string | null, parentId: string | null) {
  if (!parentId) return;
  if (parentId === id) throw badRequest('A team member cannot report to themselves', undefined, 'INVALID_PARENT');
  const members = new Map((await all()).map((m) => [m.id, m]));
  if (!members.has(parentId)) throw badRequest('parentId does not match any team member', undefined, 'INVALID_PARENT');
  // Walk up from the proposed parent; reaching `id` would create a cycle.
  let cursor: string | null = parentId;
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor)) {
    if (cursor === id) throw badRequest('That reporting line would create a loop in the org chart', undefined, 'ORG_CYCLE');
    seen.add(cursor);
    cursor = members.get(cursor)?.parentId ?? null;
  }
}

export async function create(input: TeamInput): Promise<TeamMember> {
  await assertValidParent(null, input.parentId);
  const ref = await team.add({ ...input, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  return snapToObject<TeamMember>(await ref.get());
}

export async function update(id: string, patch: Partial<TeamInput>): Promise<TeamMember> {
  const snap = await team.doc(id).get();
  if (!snap.exists) throw notFound('Team member not found');
  if (patch.parentId !== undefined) await assertValidParent(id, patch.parentId);
  await team.doc(id).update({ ...patch, updatedAt: FieldValue.serverTimestamp() });
  return snapToObject<TeamMember>(await team.doc(id).get());
}

/** Removing someone re-attaches their direct reports to the removed member's own manager. */
export async function remove(id: string): Promise<void> {
  const snap = await team.doc(id).get();
  if (!snap.exists) throw notFound('Team member not found');
  const parentId = (snap.data()?.parentId as string | null) ?? null;
  const reports = await team.where('parentId', '==', id).get();
  const batch = db.batch();
  reports.docs.forEach((d) => batch.update(d.ref, { parentId, updatedAt: FieldValue.serverTimestamp() }));
  batch.delete(team.doc(id));
  await batch.commit();
}
