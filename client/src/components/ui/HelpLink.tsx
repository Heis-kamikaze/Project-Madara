import { Link } from 'react-router-dom'

/**
 * The "help button" for archived collections: opens support with a pre-filled message.
 * Style this as a prominent button.
 */
export default function HelpLink({ about }: { about?: string }) {
  const text = about ? `I'd like help with "${about}", which is archived.` : "I'd like help with an archived collection."
  return <Link to={`/support?message=${encodeURIComponent(text)}`}>Need help? Talk to us</Link>
}
