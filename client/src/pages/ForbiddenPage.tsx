import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'

export default function ForbiddenPage() {
  usePageTitle('No access')
  return (
    <section className="mx-auto max-w-md pt-12 text-center">
      <p className="eyebrow">Restricted</p>
      <h1 className="mt-2 font-serif text-[26px]">You do not have access to this page</h1>
      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">Your role does not include this area. If you think that is a mistake, ask the owner to review your role.</p>
      <Link to="/" className="btn btn-outline btn-sm mt-6">Back to the atelier</Link>
    </section>
  )
}
