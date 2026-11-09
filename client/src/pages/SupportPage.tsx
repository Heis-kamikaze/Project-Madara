import { useSearchParams } from 'react-router-dom'
import HelpPanel from '../components/support/HelpPanel'
import { usePageTitle } from '../hooks/usePageTitle'

/**
 * The Help Concierge as a page, for deep links (emails, notifications).
 * Inside the app it normally opens as an overlay: useHelp().open(). `?message=…` pre-fills the first message.
 */
export default function SupportPage() {
  usePageTitle('Help')
  const [params] = useSearchParams()
  return (
    <section className="mx-auto max-w-md pt-4 lg:pt-12">
      <h1 className="sr-only">Help</h1>
      <div className="rounded-[18px] bg-ink p-4 text-bg shadow-[0_20px_40px_rgb(0_0_0/0.2)]">
        <p className="font-serif text-[15px] italic">Need Help?</p>
        <p className="mb-3 mt-1 text-[10px] leading-snug text-white/55">We reply within 12 hours — sooner if it's about an order.</p>
        <HelpPanel initialMessage={params.get('message') ?? ''} />
      </div>
    </section>
  )
}
