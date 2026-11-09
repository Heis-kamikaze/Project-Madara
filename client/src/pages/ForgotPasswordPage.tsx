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
    <section className="mx-auto max-w-sm pt-4 lg:pt-12">
      <p className="eyebrow">Membership</p>
      <h1 className="mt-2 font-serif text-[28px]">Reset your password</h1>
      {sent ? (
        <p role="status" className="mt-4 text-[12.5px] leading-relaxed">
          If an account exists for {email}, a reset link is on its way.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6">
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </Field>
          <button type="submit" className="btn btn-block">
            Send reset link
          </button>
          {error ? <p role="alert">{error}</p> : null}
        </form>
      )}
      <p className="mt-5 text-center text-[11.5px]">
        <Link to="/login" className="underline underline-offset-4">Back to sign in</Link>
      </p>
    </section>
  )
}
