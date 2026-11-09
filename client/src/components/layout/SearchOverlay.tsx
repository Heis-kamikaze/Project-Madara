import { useOverlay } from '../../hooks/useOverlay'
import { IconClose } from '../icons'
import IconButton from '../ui/IconButton'
import SearchBox from './SearchBox'

/** Full-screen search for small screens (opened by the search icon in the topbar). */
export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  useOverlay(onClose)
  return (
    <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-50 overflow-y-auto bg-bg lg:hidden" data-anim="search-overlay">
      <div className="mx-auto max-w-[520px] px-[18px] pt-3">
        <div className="flex items-center gap-3">
          <SearchBox className="flex-1" autoFocus onDone={onClose} />
          <IconButton label="Close search" onClick={onClose}>
            <IconClose />
          </IconButton>
        </div>
        <p className="mt-6 text-[11px] uppercase tracking-[0.12em] text-ink-faint">Search singles by name or story</p>
      </div>
    </div>
  )
}
