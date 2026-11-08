import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAddComment, useComments, useDeleteComment, useDeletePost, useHidePost, usePost } from '../api/community'
import { useAuth } from '../auth/useAuth'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatDate, humanize } from '../lib/format'

export default function PostPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { status, me, can } = useAuth()
  const post = usePost(id)
  const comments = useComments(id)
  const addComment = useAddComment()
  const deleteComment = useDeleteComment()
  const deletePost = useDeletePost()
  const hidePost = useHidePost()
  const [body, setBody] = useState('')
  usePageTitle(post.data?.title ?? 'Post')

  if (post.isLoading) return <Loading />
  if (post.error || !post.data) return <ErrorMessage error={post.error ?? new Error('Post not found')} />
  const p = post.data

  const uid = me?.uid
  const moderator = can('community:moderate')
  const canDeletePost = !!uid && (uid === p.authorId || moderator)

  async function onComment(e: FormEvent) {
    e.preventDefault()
    if (!id) return
    await addComment.mutateAsync({ postId: id, body: body.trim() })
    setBody('')
  }

  async function onDeletePost() {
    if (!id || !window.confirm('Delete this post and its comments?')) return
    await deletePost.mutateAsync(id)
    navigate('/community')
  }

  return (
    <article>
      <p>
        <Link to="/community">← Community</Link>
      </p>
      <p>{humanize(p.type)}</p>
      <h1>{p.title}</h1>
      {p.coverImageUrl ? <img src={p.coverImageUrl} alt="" /> : null}
      <p>
        {p.authorName} · {formatDate(p.publishedAt, true)}
      </p>
      <div style={{ whiteSpace: 'pre-wrap' }}>{p.body}</div>

      {canDeletePost ? (
        <p>
          <button type="button" onClick={() => void onDeletePost()}>
            Delete post
          </button>
          {moderator && p.status === 'published' ? (
            <button type="button" onClick={() => id && hidePost.mutate(id)}>
              Hide post
            </button>
          ) : null}
        </p>
      ) : null}
      <ErrorMessage error={deletePost.error ?? hidePost.error} />

      <h2>Comments ({p.commentCount})</h2>
      {comments.isLoading ? <Loading /> : null}
      <ul>
        {comments.data?.map((c) => (
          <li key={c.id}>
            <strong>{c.authorName}</strong> <time dateTime={c.createdAt}>{formatDate(c.createdAt, true)}</time>
            <p style={{ whiteSpace: 'pre-wrap' }}>{c.body}</p>
            {uid && (uid === c.authorId || moderator) ? (
              <button type="button" onClick={() => id && deleteComment.mutate({ postId: id, commentId: c.id })}>
                Delete
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <ErrorMessage error={deleteComment.error} />

      {status === 'signedIn' ? (
        <form onSubmit={onComment}>
          <label>
            <span>Add a comment</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={3} required />
          </label>
          <button type="submit" disabled={addComment.isPending}>
            Comment
          </button>
          <ErrorMessage error={addComment.error} />
        </form>
      ) : (
        <p>
          <Link to={`/login?next=${encodeURIComponent(`/community/${p.id}`)}`}>Sign in</Link> to comment.
        </p>
      )}
    </article>
  )
}
