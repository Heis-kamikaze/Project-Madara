import { usePageTitle } from '../hooks/usePageTitle'

/**
 * Placeholder: the design has a Collaborations grid, but the API has no collaborations module yet.
 * When one exists, add src/api/collaborations.ts and render a grid like PiecesPage here.
 */
export default function CollaborationsPage() {
  usePageTitle('Collaborations')
  return (
    <section className="pt-2 lg:pt-6">
      <h1 className="sr-only">Collaborations</h1>
      <p className="tag">Price</p>
      <p className="mt-2 max-w-md text-[12px] leading-relaxed text-ink-faint lg:text-[14px]">Limited-run pieces with guest designers &amp; partner ateliers.</p>
      <p className="mt-10 font-serif text-[15px] italic text-ink-soft">The first collaborations arrive soon.</p>
    </section>
  )
}
