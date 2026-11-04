import { FieldValue, db } from '../../config/firebase';
import { forbidden, notFound } from '../../lib/errors';
import { paginate, snapToObject } from '../../lib/firestore';
import { can } from '../../middleware/authorize';
import type { AuthUser } from '../../types/express';
import type { Post, PostType } from '../../types/models';

const posts = db.collection('posts');
const commentsOf = (postId: string) => posts.doc(postId).collection('comments');

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export function listPublished(opts: { type?: PostType; limit: number; cursor?: string }) {
  let q = posts.where('status', '==', 'published');
  if (opts.type) q = q.where('type', '==', opts.type);
  return paginate<Post>(q.orderBy('publishedAt', 'desc'), posts, opts.limit, opts.cursor);
}

export async function getPost(id: string, user?: AuthUser): Promise<Post> {
  const snap = await posts.doc(id).get();
  if (!snap.exists) throw notFound('Post not found');
  const post = snapToObject<Post>(snap);
  if (post.status === 'hidden' && !(user && (can(user, 'community:moderate') || user.uid === post.authorId))) throw notFound('Post not found');
  return post;
}

export interface PostInput {
  type: PostType;
  title: string;
  body: string;
  coverImageUrl: string | null;
}

/** News and campaigns are brand announcements (staff). Discussions can be started by any signed-in customer. */
export async function createPost(user: AuthUser, input: PostInput): Promise<Post> {
  if (input.type !== 'discussion' && !can(user, 'community:write')) {
    throw forbidden('Only the Aradam team can publish news and campaign updates', 'INSUFFICIENT_PERMISSION');
  }
  const ref = await posts.add({
    type: input.type,
    title: input.title,
    body: input.body,
    coverImageUrl: input.coverImageUrl,
    authorId: user.uid,
    authorName: user.name ?? user.email?.split('@')[0] ?? 'Member',
    status: 'published',
    pinned: false,
    commentCount: 0,
    publishedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return snapToObject<Post>(await ref.get());
}

function assertCanEdit(user: AuthUser, post: Post) {
  const isAuthor = post.authorId === user.uid;
  if (!isAuthor && !can(user, 'community:moderate')) throw forbidden('You can only change your own posts');
}

export async function updatePost(
  user: AuthUser,
  id: string,
  patch: { title?: string; body?: string; coverImageUrl?: string | null; pinned?: boolean },
): Promise<Post> {
  const post = await getPost(id, user);
  assertCanEdit(user, post);
  if (patch.pinned !== undefined && !can(user, 'community:moderate')) throw forbidden('Only moderators can pin posts');
  await posts.doc(id).update({ ...patch, updatedAt: FieldValue.serverTimestamp() });
  return getPost(id, user);
}

export async function setHidden(id: string, hidden: boolean): Promise<Post> {
  const snap = await posts.doc(id).get();
  if (!snap.exists) throw notFound('Post not found');
  await posts.doc(id).update({ status: hidden ? 'hidden' : 'published', updatedAt: FieldValue.serverTimestamp() });
  return snapToObject<Post>(await posts.doc(id).get());
}

export async function deletePost(user: AuthUser, id: string): Promise<void> {
  const post = await getPost(id, user);
  assertCanEdit(user, post);
  // Comments live in a sub-collection; remove them with the post.
  const comments = await commentsOf(id).limit(450).get();
  const batch = db.batch();
  comments.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(posts.doc(id));
  await batch.commit();
}

export async function listComments(postId: string, user: AuthUser | undefined, limit: number): Promise<Comment[]> {
  await getPost(postId, user);
  const snaps = await commentsOf(postId).orderBy('createdAt', 'asc').limit(limit).get();
  return snaps.docs.map((d) => snapToObject<Comment>(d));
}

export async function addComment(user: AuthUser, postId: string, body: string): Promise<Comment> {
  const post = await getPost(postId, user);
  if (post.status !== 'published') throw notFound('Post not found');
  const ref = commentsOf(postId).doc();
  const batch = db.batch();
  batch.set(ref, {
    authorId: user.uid,
    authorName: user.name ?? user.email?.split('@')[0] ?? 'Member',
    body,
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.update(posts.doc(postId), { commentCount: FieldValue.increment(1) });
  await batch.commit();
  return snapToObject<Comment>(await ref.get());
}

export async function deleteComment(user: AuthUser, postId: string, commentId: string): Promise<void> {
  const ref = commentsOf(postId).doc(commentId);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Comment not found');
  if (snap.data()?.authorId !== user.uid && !can(user, 'community:moderate')) throw forbidden('You can only delete your own comments');
  const batch = db.batch();
  batch.delete(ref);
  batch.update(posts.doc(postId), { commentCount: FieldValue.increment(-1) });
  await batch.commit();
}
