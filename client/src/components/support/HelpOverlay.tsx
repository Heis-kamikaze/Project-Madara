import { useHelp } from '../../help/useHelp'
import { useOverlay } from '../../hooks/useOverlay'
import { IconClose } from '../icons'
import IconButton from '../ui/IconButton'
import HelpPanel from './HelpPanel'

function HelpSheet({ prefill, onClose }: { prefill: string; onClose: () => void }) {
  useOverlay(onClose)
  return (
    <div role="dialog" aria-modal="true" aria-label="Help concierge" className="fixed inset-0 z-[60]" data-anim="help">
      <button type="button" aria-label="Close help" onClick={onClose} className="absolute inset-0 cursor-default bg-ink/30" />
      <div
        data-anim="help-panel"
        className="absolute inset-x-3.5 bottom-3.5 max-h-[85dvh] overflow-y-auto rounded-[18px] bg-ink p-4 text-bg shadow-[0_20px_40px_rgb(0_0_0/0.35)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px]"
      >
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-serif text-[15px] italic">Need Help?</span>
          <IconButton label="Close help" onClick={onClose} tone="dark">
            <IconClose />
          </IconButton>
        </div>
        <p className="mb-3 text-[10px] leading-snug text-white/55">We reply within 12 hours — sooner if it's about an order.</p>
        <HelpPanel initialMessage={prefill} />
      </div>
    </div>
  )
}

/** The Help Concierge: an overlay (not a page) that can open on top of anything. */
export default function HelpOverlay() {
  const { isOpen, prefill, close } = useHelp()
  return isOpen ? <HelpSheet prefill={prefill} onClose={close} /> : null
}
