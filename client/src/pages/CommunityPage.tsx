import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCreatePost, usePosts } from '../api/community'
import { useAuth } from '../auth/useAuth'
import ErrorMessage from '../components/ui/ErrorMessage'
import Field from '../components/ui/Field'
import LoadMore from '../components/ui/LoadMore'
import Loading from '../components/ui/Loading'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatDate, humanize } from '../lib/format'
import type { PostType } from '../types/api'

export default function CommunityPage() {
  usePageTitle('Community')
  const { status } = useAuth()
  const [type, setType] = useState<PostType | ''>('')
  const posts = usePosts(type || undefined)
  const createPost = useCreatePost()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    await createPost.mutateAsync({ type: 'discussion', title: title.trim(), body: body.trim(), coverImageUrl: null })
    setTitle('')
    setBody('')
  }

  return (
    <section>
      <h1>Community</h1>

      <label>
        <span>Show</span>
        <select value={type} onChange={(e) => setType(e.target.value as PostType | '')}>
          <option value="">Everything</option>
          <option value="news">News</option>
          <option value="campaign">Campaigns</option>
          <option value="discussion">Discussions</option>
        </select>
      </label>

      {posts.isLoading ? <Loading /> : null}
      <ErrorMessage error={posts.error} />
      {!posts.isLoading && posts.items.length === 0 ? <p>Nothing here yet.</p> : null}
      <ul>
        {posts.items.map((post) => (
          <li key={post.id}>
            <article data-type={post.type} data-pinned={post.pinned}>
              <p>{humanize(post.type)}</p>
              <h2>
                <Link to={`/community/${post.id}`}>{post.title}</Link>
              </h2>
              <p>
                {post.authorName} · {formatDate(post.publishedAt)} · {post.commentCount} comments
              </p>
            </article>
          </li>
        ))}
      </ul>
      <LoadMore hasNextPage={!!posts.hasNextPage} isFetchingNextPage={posts.isFetchingNextPage} onClick={() => void posts.fetchNextPage()} />

      <h2>Start a discussion</h2>
      {status === 'signedIn' ? (
        <form onSubmit={onSubmit}>
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
          </Field>
          <Field label="What would you like to talk about?">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={10000} rows={5} required />
          </Field>
          <button type="submit" disabled={createPost.isPending}>
            {createPost.isPending ? 'Posting…' : 'Post'}
          </button>
          <ErrorMessage error={createPost.error} />
        </form>
      ) : (
        <p>
          <Link to="/login?next=/community">Sign in</Link> to join the conversation.
        </p>
      )}
    </section>
  )
}
