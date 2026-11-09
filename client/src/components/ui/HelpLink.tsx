import { useHelp } from '../../help/useHelp'

/**
 * The "help button" for archived collections: opens the Help Concierge overlay with a
 * pre-filled message. Works from any page.
 */
export default function HelpLink({ about }: { about?: string }) {
  const { open } = useHelp()
  const text = about ? `I'd like help with "${about}", which is archived.` : "I'd like help with an archived collection."
  return (
    <button type="button" onClick={() => open(text)} className="btn btn-outline btn-sm">
      Need help? Ask the atelier
    </button>
  )
}
