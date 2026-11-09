import { humanize } from '../../lib/format'

const TONE: Record<string, string> = {
  paid: 'bg-gold-light text-espresso',
  delivered: 'bg-gold-light text-espresso',
  confirmed: 'bg-gold-light text-espresso',
  completed: 'bg-gold-light text-espresso',
  ready: 'bg-gold-light text-espresso',
  owned: 'bg-gold-light text-espresso',
  needs_attention: 'bg-burnt/15 text-burnt',
  cancelled: 'bg-bg-alt text-ink-faint',
  refunded: 'bg-bg-alt text-ink-faint',
  sold_out: 'bg-bg-alt text-ink-faint',
}

/** Small status pill. Target it with [data-status="paid"] if you want per-status styling. */
export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      data-status={status}
      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${TONE[status] ?? 'border border-line text-ink-soft'}`}
    >
      {humanize(status)}
    </span>
  )
}
