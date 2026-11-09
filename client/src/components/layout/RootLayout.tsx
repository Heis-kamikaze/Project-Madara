import { Link, Outlet, ScrollRestoration } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import HelpOverlay from '../support/HelpOverlay'
import Topbar from './Topbar'

export default function RootLayout() {
  const { bootError } = useAuth()
  return (
    <div className="flex min-h-dvh flex-col">
      <Topbar />
      {bootError ? (
        <p role="alert" className="mx-auto w-full max-w-[1280px] px-[18px] py-2 lg:px-10">
          You are signed in, but we could not reach the server: {bootError} Please reload the page to try again.
        </p>
      ) : null}
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-[18px] pb-20 lg:px-10">
        <Outlet />
      </main>
      <footer className="border-t border-line px-[18px] py-6 text-[11px] text-ink-faint lg:px-10">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} Aradam</span>
          <nav aria-label="Footer" className="flex gap-5">
            <Link to="/about" className="hover:text-gold">About</Link>
            <Link to="/team" className="hover:text-gold">Team</Link>
            <Link to="/museum" className="hover:text-gold">Museum</Link>
          </nav>
        </div>
      </footer>
      <HelpOverlay />
      <ScrollRestoration />
    </div>
  )
}
