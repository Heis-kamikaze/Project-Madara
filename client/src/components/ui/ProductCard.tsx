import { Link } from 'react-router-dom'
import { formatNaira } from '../../lib/format'

interface Props {
  slug: string
  title: string
  priceNgn: number
  imageUrl?: string | null
  status: string
}

export default function ProductCard({ slug, title, priceNgn, imageUrl, status }: Props) {
  return (
    <article data-status={status}>
      <Link to={`/pieces/${slug}`}>
        {imageUrl ? <img src={imageUrl} alt="" loading="lazy" /> : null}
        <h3>{title}</h3>
      </Link>
      <p>{status === 'sold_out' ? 'Sold out' : status === 'archived' ? 'Archived' : formatNaira(priceNgn)}</p>
    </article>
  )
}
