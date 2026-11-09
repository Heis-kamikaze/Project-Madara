import { Link } from 'react-router-dom'
import { formatDate } from '../../lib/format'
import type { Collection } from '../../types/api'
import Media from './Media'

export default function CollectionCard({ collection: c }: { collection: Collection }) {
  const note =
    c.status === 'archived'
      ? 'Archived'
      : c.availability === 'upcoming'
        ? `Opens ${formatDate(c.availableFrom)}`
        : c.availableUntil
          ? `Until ${formatDate(c.availableUntil)}`
          : 'Available now'
  return (
    <article data-status={c.status} data-availability={c.availability}>
      <Link to={`/collections/${c.slug}`} className="block">
        <Media src={c.coverImageUrl} seed={c.slug} alt={c.title} className="aspect-[4/5] w-full" />
        <h3 className="mt-2 font-sans text-[10.5px] font-semibold uppercase tracking-[0.03em] lg:text-xs">{c.title}</h3>
        <p className="mt-0.5 text-[10.5px] text-ink-faint">{note}</p>
      </Link>
    </article>
  )
}
