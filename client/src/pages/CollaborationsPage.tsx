import { usePageTitle } from '../hooks/usePageTitle'

/**
 * Placeholder: the donut menu lists "Collaborations", but the API has no collaborations
 * module yet. When one exists, add src/api/collaborations.ts and render it here.
 */
export default function CollaborationsPage() {
  usePageTitle('Collaborations')
  return (
    <section>
      <h1>Collaborations</h1>
      <p>Collaborations will appear here soon.</p>
    </section>
  )
}
