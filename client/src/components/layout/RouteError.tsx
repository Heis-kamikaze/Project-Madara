import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'

/** Shown when a page crashes or a lazy route fails to load. */
export default function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : 'Unknown error'
  return (
    <main>
      <h1>Something went wrong</h1>
      <p>{message}</p>
      <p>
        <Link to="/">Back to the homepage</Link>
      </p>
    </main>
  )
}
