import { Link } from 'react-router-dom'
import { formatDate } from '../../lib/format'
import type { Collection } from '../../types/api'

export default function CollectionCard({ collection: c }: { collection: Collection }) {
  return (
    <article data-status={c.status} data-availability={c.availability}>
      <Link to={`/collections/${c.slug}`}>
        {c.coverImageUrl ? <img src={c.coverImageUrl} alt="" loading="lazy" /> : null}
        <h3>{c.title}</h3>
      </Link>
      <p>
        {c.status === 'archived'
          ? 'Archived'
          : c.availability === 'upcoming'
            ? `Opens ${formatDate(c.availableFrom, true)}`
            : c.availableUntil
              ? `Available until ${formatDate(c.availableUntil, true)}`
              : 'Available now'}
      </p>
    </article>
  )
}
