import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCreatePost, usePosts } from '../api/community'
import { useAuth } from '../auth/useAuth'
import ErrorMessage from '../components/ui/ErrorMessage'
import Field from '../components/ui/Field'
import LoadMore from '../components/ui/LoadMore'
import Loading from '../components/ui/Loading'
import Media from '../components/ui/Media'
import { usePageTitle } from '../hooks/usePageTitle'
import { timeAgo } from '../lib/swatch'
import type { Post, PostType } from '../types/api'

const FILTERS: { value: PostType | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'news', label: 'News' },
  { value: 'campaign', label: 'Campaigns' },
  { value: 'discussion', label: 'Discussions' },
]

const byline = (p: Post) => `${p.type === 'discussion' ? 'Community member' : 'From the team'} · ${timeAgo(p.publishedAt)}`

/** A shared feed mixing house updates with client posts, in recency order. */
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
    <section className="pt-2 lg:pt-6">
      <h1 className="sr-only">Community</h1>
      <div role="tablist" aria-label="Filter posts" className="no-scrollbar -mx-[18px] flex gap-2 overflow-x-auto px-[18px] lg:mx-0 lg:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={type === f.value}
            onClick={() => setType(f.value)}
            className={`flex-none rounded-full border px-4 py-1.5 text-[11px] font-semibold tracking-[0.06em] ${type === f.value ? 'border-ink bg-ink text-bg' : 'border-line text-ink-soft hover:bg-bg-alt'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {posts.isLoading ? <Loading /> : null}
      <ErrorMessage error={posts.error} />
      {!posts.isLoading && posts.items.length === 0 ? <p className="mt-8 font-serif text-[15px] italic text-ink-soft">Nothing here yet.</p> : null}

      <ul data-anim="stagger" className="mt-5 divide-y divide-line lg:max-w-2xl">
        {posts.items.map((post) => (
          <li key={post.id} data-type={post.type} data-pinned={post.pinned} className="py-4 first:pt-0">
            <Link to={`/community/${post.id}`} className="block">
              {post.coverImageUrl ? <Media src={post.coverImageUrl} seed={post.id} alt="" className="mb-2 h-[140px] w-full !rounded-lg lg:h-[240px]" /> : null}
              <h2 className="font-sans text-[13px] font-semibold lg:text-[15px]">{post.title}</h2>
              <p className="mt-0.5 text-[10.5px] text-ink-faint">
                {byline(post)} · {post.commentCount} comments
              </p>
            </Link>
          </li>
        ))}
      </ul>
      <LoadMore hasNextPage={!!posts.hasNextPage} isFetchingNextPage={posts.isFetchingNextPage} onClick={() => void posts.fetchNextPage()} />

      <details className="mt-8 lg:max-w-2xl">
        <summary className="eyebrow">Start a discussion</summary>
        <div className="mt-4">
          {status === 'signedIn' ? (
            <form onSubmit={onSubmit}>
              <Field label="Title">
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
              </Field>
              <Field label="What would you like to talk about?">
                <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={10000} rows={5} required />
              </Field>
              <button type="submit" disabled={createPost.isPending} className="btn self-start">
                {createPost.isPending ? 'Posting…' : 'Post'}
              </button>
              <ErrorMessage error={createPost.error} />
            </form>
          ) : (
            <p className="text-[12px] text-ink-soft">
              <Link to="/login?next=/community" className="underline underline-offset-4">Sign in</Link> to join the conversation.
            </p>
          )}
        </div>
      </details>
    </section>
  )
}
