import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { authErrorMessage } from '../auth/errors'
import { useAuth } from '../auth/useAuth'
import Field from '../components/ui/Field'
import { usePageTitle } from '../hooks/usePageTitle'
import { safeNext } from '../lib/safeNext'

export default function RegisterPage() {
  usePageTitle('Create an account')
  const { status, signUp, signInWithGoogle } = useAuth()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'), '/account')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (status === 'signedIn') return <Navigate to={next} replace />

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void run(() => signUp({ email: email.trim(), password, displayName: displayName.trim() }))
  }

  return (
    <section>
      <h1>Create an account</h1>
      <form onSubmit={onSubmit}>
        <Field label="Your name">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" required maxLength={80} />
        </Field>
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </Field>
        <Field label="Password" hint="At least 6 characters">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={6} required />
        </Field>
        <button type="submit" disabled={busy}>
          {busy ? 'Creating your account…' : 'Create account'}
        </button>
        {error ? <p role="alert">{error}</p> : null}
      </form>
      <button type="button" disabled={busy} onClick={() => void run(signInWithGoogle)}>
        Continue with Google
      </button>
      <p>
        Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
      </p>
    </section>
  )
}
