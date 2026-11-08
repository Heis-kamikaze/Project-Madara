import { Link } from 'react-router-dom'
import { useLanding } from '../api/site'
import ErrorMessage from '../components/ui/ErrorMessage'
import { usePageTitle } from '../hooks/usePageTitle'

export default function LandingPage() {
  usePageTitle('')
  const { data: landing, isLoading, error } = useLanding()

  return (
    <section>
      {landing?.heroVideoUrl ? (
        <video src={landing.heroVideoUrl} poster={landing.heroPosterUrl ?? undefined} autoPlay muted loop playsInline aria-hidden="true" />
      ) : null}
      <h1>{landing?.headline ?? (isLoading ? '' : 'Aradam')}</h1>
      {landing?.subheadline ? <p>{landing.subheadline}</p> : null}
      {landing?.featuredCollectionId ? <Link to={`/collections/${landing.featuredCollectionId}`}>Explore the collection</Link> : null}
      <ErrorMessage error={error} />
    </section>
  )
}
