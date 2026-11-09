import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { authErrorMessage } from '../auth/errors'
import { useAuth } from '../auth/useAuth'
import Field from '../components/ui/Field'
import { usePageTitle } from '../hooks/usePageTitle'
import { safeNext } from '../lib/safeNext'

export default function LoginPage() {
  usePageTitle('Sign in')
  const { status, signIn, signInWithGoogle } = useAuth()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'), '/account')
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
    void run(() => signIn(email.trim(), password))
  }

  return (
    <section className="mx-auto max-w-sm pt-4 lg:pt-12">
      <p className="eyebrow">Membership</p>
      <h1 data-anim="reveal" className="mt-2 font-serif text-[28px]">
        Sign In
      </h1>
      <p className="mb-6 mt-2 text-[12.5px] leading-relaxed text-ink-soft">Welcome back to the Atelier.</p>
      <form onSubmit={onSubmit}>
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required />
        </Field>
        <Field label="Password">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </Field>
        <button type="submit" disabled={busy} className="btn btn-block">
          {busy ? 'Signing in…' : 'Enter the Atelier'}
        </button>
        {error ? <p role="alert">{error}</p> : null}
      </form>
      <button type="button" disabled={busy} onClick={() => void run(signInWithGoogle)} className="btn btn-outline btn-block mt-3">
        Continue with Google
      </button>
      <p className="mt-5 text-center text-[11.5px] text-ink-soft">
        <Link to="/forgot-password" className="underline underline-offset-4">Forgot your password?</Link>
      </p>
      <p className="mt-3 text-center text-[11.5px] text-ink-soft">
        New to Aradam?{' '}
        <Link to={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-gold underline">
          Create an account
        </Link>
      </p>
    </section>
  )
}
