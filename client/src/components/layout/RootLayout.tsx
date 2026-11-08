import { Link, Outlet, ScrollRestoration } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import DonutNav from './DonutNav'

export default function RootLayout() {
  const { bootError } = useAuth()
  return (
    <>
      <header>
        <Link to="/">Aradam</Link>
        <DonutNav />
      </header>
      {bootError ? (
        <p role="alert">
          You are signed in, but we could not reach the server: {bootError} Please reload the page to try again.
        </p>
      ) : null}
      <main>
        <Outlet />
      </main>
      <footer>
        <small>© {new Date().getFullYear()} Aradam</small>
      </footer>
      <ScrollRestoration />
    </>
  )
}
