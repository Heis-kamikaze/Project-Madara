import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authErrorMessage } from '../auth/errors'
import { useAuth } from '../auth/useAuth'
import Field from '../components/ui/Field'
import { usePageTitle } from '../hooks/usePageTitle'

export default function ForgotPasswordPage() {
  usePageTitle('Reset your password')
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await resetPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(authErrorMessage(err))
    }
  }

  return (
    <section>
      <h1>Reset your password</h1>
      {sent ? (
        <p role="status">If an account exists for {email}, a reset link is on its way.</p>
      ) : (
        <form onSubmit={onSubmit}>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </Field>
          <button type="submit">Send reset link</button>
          {error ? <p role="alert">{error}</p> : null}
        </form>
      )}
      <p>
        <Link to="/login">Back to sign in</Link>
      </p>
    </section>
  )
}
