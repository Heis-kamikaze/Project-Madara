import { humanize } from '../../lib/format'

/** Style it with the data-status attribute, e.g. [data-status="paid"] { … } */
export default function StatusBadge({ status }: { status: string }) {
  return <span data-status={status}>{humanize(status)}</span>
}
