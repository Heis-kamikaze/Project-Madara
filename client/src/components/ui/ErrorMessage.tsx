import { errorMessage } from '../../lib/api'

/** Renders nothing when there is no error. */
export default function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <p role="alert" className="my-2">
      {errorMessage(error)}
    </p>
  )
}
