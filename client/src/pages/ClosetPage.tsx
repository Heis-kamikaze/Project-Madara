import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCloset } from '../api/closet'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import StatusBadge from '../components/ui/StatusBadge'
import { usePageTitle } from '../hooks/usePageTitle'

/** The customer's private digital closet. Lay the items out as a visual wardrobe with your own CSS. */
export default function ClosetPage() {
  usePageTitle('My closet')
  const navigate = useNavigate()
  const { data: items, isLoading, error } = useCloset()
  const [code, setCode] = useState('')

  function onCode(e: FormEvent) {
    e.preventDefault()
    const value = code.trim().toUpperCase()
    if (value) navigate(`/verify/${encodeURIComponent(value)}`)
  }

  return (
    <section>
      <h1>My closet</h1>
      {isLoading ? <Loading /> : null}
      <ErrorMessage error={error} />
      {items && items.length === 0 ? <p>Your closet is empty. Pieces appear here when you authenticate them or when a custom piece is started for you.</p> : null}
      <ul>
        {items?.map((item) => (
          <li key={item.id} data-favorite={item.isFavorite} data-status={item.status}>
            <Link to={`/closet/${item.id}`}>
              {item.imageUrls[0] ? <img src={item.imageUrls[0]} alt="" loading="lazy" /> : null}
              <h2>{item.title}</h2>
            </Link>
            <StatusBadge status={item.status} />
            {item.isFavorite ? <span> ★</span> : null}
          </li>
        ))}
      </ul>

      <form onSubmit={onCode}>
        <label>
          <span>Have a code from your packaging?</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ARD-XXXX-XXXX-XXXX" />
        </label>
        <button type="submit">Authenticate a piece</button>
      </form>
    </section>
  )
}
