export default function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <p role="status" className="py-6 font-serif text-[13px] italic text-ink-faint">
      {label}
    </p>
  )
}
