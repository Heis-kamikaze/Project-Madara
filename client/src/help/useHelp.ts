import { useContext } from 'react'
import { HelpContext, type HelpState } from './context'

export function useHelp(): HelpState {
  const ctx = useContext(HelpContext)
  if (!ctx) throw new Error('useHelp must be used inside <HelpProvider>')
  return ctx
}
