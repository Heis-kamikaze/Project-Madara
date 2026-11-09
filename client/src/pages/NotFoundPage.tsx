import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'

export default function NotFoundPage() {
  usePageTitle('Page not found')
  return (
    <section className="mx-auto max-w-md pt-12 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 font-serif text-[26px]">Page not found</h1>
      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">The page you are looking for does not exist or has moved.</p>
      <Link to="/" className="btn btn-outline btn-sm mt-6">Back to the atelier</Link>
    </section>
  )
}
