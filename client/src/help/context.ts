import { createContext } from 'react'

export interface HelpState {
  isOpen: boolean
  /** Text pre-filled in the first message box (e.g. from an archived-collection notice). */
  prefill: string
  /** Opens the concierge from anywhere. */
  open: (prefill?: string) => void
  close: () => void
}

export const HelpContext = createContext<HelpState | null>(null)
