import { Link } from 'react-router-dom'
import { formatNaira } from '../../lib/format'
import Media from './Media'

interface Props {
  slug: string
  title: string
  priceNgn: number
  imageUrl?: string | null
  status: string
}

/** "Just the piece, with the price": photo and price only. */
export default function ProductCard({ slug, title, priceNgn, imageUrl, status }: Props) {
  return (
    <article data-status={status}>
      <Link to={`/pieces/${slug}`} className="block" aria-label={title}>
        <Media src={imageUrl} seed={slug} alt={title} className="aspect-[4/5] w-full" />
        <p className="price mt-2 text-[13px] lg:text-[15px]">
          {status === 'sold_out' ? 'Sold out' : status === 'archived' ? 'Archived' : formatNaira(priceNgn)}
        </p>
      </Link>
    </article>
  )
}
