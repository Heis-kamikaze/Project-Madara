import { useState } from 'react'
import { IconBack, IconArrow } from '../icons'

interface Props {
  /** Selected day as YYYY-MM-DD, or '' */
  value: string
  onChange: (day: string) => void
}

const pad = (n: number) => String(n).padStart(2, '0')
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Month calendar for booking. Past days are disabled. */
export default function CalendarPicker({ value, onChange }: Props) {
  const today = new Date()
  const todayKey = key(today.getFullYear(), today.getMonth(), today.getDate())
  const [cursor, setCursor] = useState(() => ({ year: today.getFullYear(), month: today.getMonth() }))

  const first = new Date(cursor.year, cursor.month, 1)
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array<null>(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const label = new Intl.DateTimeFormat('en-NG', { month: 'long', year: 'numeric' }).format(first)

  const shift = (delta: number) =>
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  const isCurrentMonth = cursor.year === today.getFullYear() && cursor.month === today.getMonth()

  return (
    <div className="card p-4" data-anim="calendar">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" aria-label="Previous month" disabled={isCurrentMonth} onClick={() => shift(-1)} className="flex size-8 items-center justify-center rounded-full border border-line">
          <IconBack className="size-3.5" />
        </button>
        <p className="font-serif text-[14px]">{label}</p>
        <button type="button" aria-label="Next month" onClick={() => shift(1)} className="flex size-8 items-center justify-center rounded-full border border-line">
          <IconArrow className="size-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10.5px] text-ink-soft">
        {WEEKDAYS.map((d) => (
          <span key={d} aria-hidden="true">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`blank-${i}`} />
          const k = key(cursor.year, cursor.month, day)
          const past = k < todayKey
          const selected = k === value
          return (
            <button
              key={k}
              type="button"
              disabled={past}
              aria-pressed={selected}
              aria-label={new Intl.DateTimeFormat('en-NG', { dateStyle: 'full' }).format(new Date(cursor.year, cursor.month, day))}
              onClick={() => onChange(k)}
              className={`rounded-full py-1.5 text-[11px] transition-colors ${selected ? 'bg-ink text-bg' : past ? 'text-ink-faint/50' : 'hover:bg-bg-alt'}`}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
