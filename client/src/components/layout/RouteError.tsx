import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'

/** Shown when a page crashes or a lazy route fails to load. */
export default function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : 'Unknown error'
  return (
    <main className="mx-auto max-w-md px-[18px] pt-20 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-2 font-serif text-[26px]">We hit a snag</h1>
      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">{message}</p>
      <Link to="/" className="btn btn-outline btn-sm mt-6">
        Back to the atelier
      </Link>
    </main>
  )
}
