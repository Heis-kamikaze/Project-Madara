// import { useState, type FormEvent } from 'react'
// import { Link, Navigate, useSearchParams } from 'react-router-dom'
// import { authErrorMessage } from '../auth/errors'
// import { useAuth } from '../auth/useAuth'
// import Field from '../components/ui/Field'
// import { usePageTitle } from '../hooks/usePageTitle'
// import { safeNext } from '../lib/safeNext'

// export default function LoginPage() {
//   usePageTitle('Sign in')
//   const { status, signIn, signInWithGoogle } = useAuth()
//   const [params] = useSearchParams()
//   const next = safeNext(params.get('next'), '/account')
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [error, setError] = useState<string | null>(null)
//   const [busy, setBusy] = useState(false)

//   if (status === 'signedIn') return <Navigate to={next} replace />

//   async function run(action: () => Promise<void>) {
//     setBusy(true)
//     setError(null)
//     try {
//       await action()
//     } catch (err) {
//       setError(authErrorMessage(err))
//     } finally {
//       setBusy(false)
//     }
//   }

//   function onSubmit(e: FormEvent) {
//     e.preventDefault()
//     void run(() => signIn(email.trim(), password))
//   }

//   return (
//     <section>
//       <h1>Sign in</h1>
//       <form onSubmit={onSubmit}>
//         <Field label="Email">
//           <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
//         </Field>
//         <Field label="Password">
//           <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
//         </Field>
//         <button type="submit" disabled={busy}>
//           {busy ? 'Signing in…' : 'Sign in'}
//         </button>
//         {error ? <p role="alert">{error}</p> : null}
//       </form>
//       <button type="button" disabled={busy} onClick={() => void run(signInWithGoogle)}>
//         Continue with Google
//       </button>
//       <p>
//         <Link to={`/forgot-password`}>Forgot your password?</Link>
//       </p>
//       <p>
//         New to Aradam? <Link to={`/register?next=${encodeURIComponent(next)}`}>Create an account</Link>
//       </p>
//     </section>
//   )
// }
