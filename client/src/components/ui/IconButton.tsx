import type { ReactNode } from 'react'

interface Props {
  label: string
  onClick: () => void
  children: ReactNode
  expanded?: boolean
  tone?: 'light' | 'dark'
}

/** Round 34px icon button used in the topbar and overlays. */
export default function IconButton({ label, onClick, children, expanded, tone = 'light' }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      onClick={onClick}
      className={`flex size-[34px] flex-none items-center justify-center rounded-full border transition-colors ${
        tone === 'dark' ? 'border-white/20 bg-white/5 text-bg hover:bg-white/15' : 'border-line bg-white/60 text-ink hover:bg-bg-alt'
      }`}
    >
      {children}
    </button>
  )
}
