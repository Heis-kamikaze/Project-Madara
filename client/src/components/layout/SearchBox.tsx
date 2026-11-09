import { useState, type FocusEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProducts } from '../../api/products'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { formatNaira } from '../../lib/format'
import { IconSearch } from '../icons'
import Media from '../ui/Media'

interface Props {
  className?: string
  autoFocus?: boolean
  /** Called after a result is chosen or the search is submitted (e.g. to close an overlay). */
  onDone?: () => void
  /** Show suggestions as a floating panel (desktop) or inline below the field (overlay). */
  floating?: boolean
}

/** Live product search. Enter opens /pieces?q=…; suggestions link straight to a piece. */
export default function SearchBox({ className = '', autoFocus = false, onDone, floating = false }: Props) {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const query = useDebouncedValue(value.trim(), 300)
  const enabled = query.length >= 2
  const results = useProducts({ q: query, limit: 6, sort: 'release', order: 'desc' }, enabled)

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    setOpen(false)
    navigate(`/pieces?q=${encodeURIComponent(q)}`)
    onDone?.()
  }

  function onBlur(e: FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
  }

  const showPanel = open && enabled

  return (
    <div className={`relative ${className}`} onBlur={onBlur}>
      <form role="search" onSubmit={submit} className="relative !block">
        <label className="sr-only">
          <span>Search pieces</span>
        </label>
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 size-[14px] -translate-y-1/2 text-ink-faint" />
        <input
          type="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => {
            setValue(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search the atelier"
          aria-label="Search pieces"
          autoComplete="off"
          className="!rounded-full !py-2.5 !pl-9 !pr-4"
        />
      </form>

      {showPanel ? (
        <div
          className={`${floating ? 'absolute right-0 top-[calc(100%+8px)] z-50 w-[320px] rounded-[14px] border border-line bg-card p-2 shadow-[0_20px_40px_-20px_rgb(28_28_21/0.35)]' : 'mt-4'}`}
          data-anim="search-results"
        >
          {results.isLoading ? <p className="px-3 py-2 text-xs italic text-ink-faint">Searching…</p> : null}
          {results.data && results.data.length === 0 ? <p className="px-3 py-2 text-xs text-ink-faint">Nothing found for “{query}”.</p> : null}
          <ul>
            {results.data?.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/pieces/${p.slug}`}
                  onClick={() => {
                    setOpen(false)
                    onDone?.()
                  }}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-bg-alt"
                >
                  <Media src={p.imageUrls[0]} seed={p.slug} className="size-11 flex-none !rounded" />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{p.title}</span>
                  <span className="price text-[12px] text-ink-soft">{formatNaira(p.priceNgn)}</span>
                </Link>
              </li>
            ))}
          </ul>
          {results.data && results.data.length > 0 ? (
            <button
              type="button"
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gold hover:bg-bg-alt"
              onClick={() => {
                setOpen(false)
                navigate(`/pieces?q=${encodeURIComponent(query)}`)
                onDone?.()
              }}
            >
              See all results
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
