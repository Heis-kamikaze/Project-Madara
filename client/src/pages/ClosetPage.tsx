import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCloset } from '../api/closet'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import Media from '../components/ui/Media'
import StatusBadge from '../components/ui/StatusBadge'
import { usePageTitle } from '../hooks/usePageTitle'

/** A private, visual wardrobe of everything the client owns. */
export default function ClosetPage() {
  usePageTitle('Closet')
  const navigate = useNavigate()
  const { data: items, isLoading, error } = useCloset()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const selected = items?.find((i) => i.id === selectedId) ?? items?.[0]
  const verified = items?.filter((i) => i.authenticated).length ?? 0

  function onCode(e: FormEvent) {
    e.preventDefault()
    const value = code.trim().toUpperCase()
    if (value) navigate(`/verify/${encodeURIComponent(value)}`)
  }

  return (
    <section className="pt-2 lg:mx-auto lg:max-w-3xl lg:pt-6">
      <h1 className="sr-only">Closet</h1>
      {isLoading ? <Loading /> : null}
      <ErrorMessage error={error} />
      {items ? (
        <p className="text-[11.5px] text-ink-faint">
          {items.length} {items.length === 1 ? 'piece' : 'pieces'}, {verified} verified by QR
        </p>
      ) : null}

      {items && items.length === 0 ? (
        <p className="mt-6 max-w-sm font-serif text-[15px] italic leading-relaxed text-ink-soft">Your closet is empty. Pieces appear here when you authenticate them or when a custom piece is started for you.</p>
      ) : null}

      {items && items.length > 0 ? (
        <>
          <div className="card mt-4 p-4" data-anim="closet">
            <ul className="no-scrollbar flex snap-x gap-3 overflow-x-auto">
              {items.map((item) => (
                <li key={item.id} className="flex-none snap-start">
                  <button
                    type="button"
                    aria-label={item.title}
                    aria-pressed={selected?.id === item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`block rounded-md border-2 p-0.5 ${selected?.id === item.id ? 'border-ink' : 'border-transparent'}`}
                  >
                    <Media src={item.imageUrls[0]} seed={item.id} className="h-[80px] w-16 lg:h-36 lg:w-28" />
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-center text-[9px] uppercase tracking-[0.06em] text-ink-faint">Swipe through your closet</p>
          </div>

          {selected ? (
            <div className="mt-5" data-favorite={selected.isFavorite}>
              <p className="tag">Selected piece</p>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <h2 className="font-sans text-[14px] font-semibold">{selected.title}</h2>
                <StatusBadge status={selected.status} />
              </div>
              {selected.story ? <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-faint">{selected.story}</p> : null}
              <Link to={`/closet/${selected.id}`} className="btn btn-outline btn-sm mt-4">
                Open piece
              </Link>
            </div>
          ) : null}
        </>
      ) : null}

      <form onSubmit={onCode} className="mt-10 max-w-sm">
        <label>
          <span>Have a code from your packaging?</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ARD-XXXX-XXXX-XXXX" />
        </label>
        <button type="submit" className="btn btn-outline btn-sm self-start">
          Authenticate a piece
        </button>
      </form>
    </section>
  )
}
