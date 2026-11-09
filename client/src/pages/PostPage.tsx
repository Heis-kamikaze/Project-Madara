import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAddComment, useComments, useDeleteComment, useDeletePost, useHidePost, usePost } from '../api/community'
import { useAuth } from '../auth/useAuth'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import Media from '../components/ui/Media'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatDate, humanize } from '../lib/format'
import { timeAgo } from '../lib/swatch'

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
    <article className="pt-1 lg:mx-auto lg:max-w-2xl lg:pt-6">
      <p className="tag">{humanize(p.type)}</p>
      <h1 data-anim="reveal" className="mt-1 font-serif text-[24px] leading-tight lg:text-[36px]">
        {p.title}
      </h1>
      <p className="mt-1.5 text-[11px] text-ink-faint">
        {p.authorName} · {formatDate(p.publishedAt, true)}
      </p>
      {p.coverImageUrl ? <Media src={p.coverImageUrl} seed={p.id} alt="" className="mt-4 h-[200px] w-full !rounded-lg lg:h-[340px]" /> : null}
      <div className="mt-5 whitespace-pre-wrap text-[13px] leading-[1.75] text-ink-soft lg:text-[15px]">{p.body}</div>

      {canDeletePost ? (
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={() => void onDeletePost()}>
            Delete post
          </button>
          {moderator && p.status === 'published' ? (
            <button type="button" onClick={() => id && hidePost.mutate(id)}>
              Hide post
            </button>
          ) : null}
        </div>
      ) : null}
      <ErrorMessage error={deletePost.error ?? hidePost.error} />

      <h2 className="mt-10 font-serif text-[18px]">Comments ({p.commentCount})</h2>
      {comments.isLoading ? <Loading /> : null}
      <ul className="mt-2 divide-y divide-line">
        {comments.data?.map((c) => (
          <li key={c.id} className="py-3">
            <p className="text-[12px] font-semibold">
              {c.authorName} <span className="ml-1 font-normal text-ink-faint">{timeAgo(c.createdAt)}</span>
            </p>
            <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-soft">{c.body}</p>
            {uid && (uid === c.authorId || moderator) ? (
              <button type="button" className="mt-1 text-[10.5px] text-ink-faint underline" onClick={() => id && deleteComment.mutate({ postId: id, commentId: c.id })}>
                Delete
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <ErrorMessage error={deleteComment.error} />

      {status === 'signedIn' ? (
        <form onSubmit={onComment} className="mt-6">
          <label>
            <span>Add a comment</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={3} required />
          </label>
          <button type="submit" disabled={addComment.isPending} className="btn self-start">
            Comment
          </button>
          <ErrorMessage error={addComment.error} />
        </form>
      ) : (
        <p className="mt-6 text-[12px] text-ink-soft">
          <Link to={`/login?next=${encodeURIComponent(`/community/${p.id}`)}`} className="underline underline-offset-4">Sign in</Link> to comment.
        </p>
      )}
    </article>
  )
}
