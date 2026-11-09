import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { HelpContext, type HelpState } from './context'

/** State for the Help Concierge overlay, which can be opened from any page. */
export function HelpProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [prefill, setPrefill] = useState('')

  const open = useCallback((text?: string) => {
    setPrefill(text ?? '')
    setOpen(true)
  }, [])
  const close = useCallback(() => setOpen(false), [])

  const value = useMemo<HelpState>(() => ({ isOpen, prefill, open, close }), [isOpen, prefill, open, close])
  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>
}
