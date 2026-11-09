import { useMapRegions } from '../api/authenticity'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import { usePageTitle } from '../hooks/usePageTitle'

/**
 * World of Aradam. The API returns anonymous counts per country/state (ISO alpha-2 country codes),
 * rendered here as chips. Drop your map library into the [data-map] box to draw them as pins.
 */
export default function WorldPage() {
  usePageTitle('World of Aradam')
  const map = useMapRegions()
  const regions = map.data?.data ?? []
  const total = typeof map.data?.meta?.total === 'number' ? map.data.meta.total : 0

  return (
    <section className="pt-2 lg:pt-6">
      <h1 className="sr-only">World of Aradam</h1>
      <div data-anim="hero" className="overflow-hidden rounded-[22px] bg-ink p-4 text-bg lg:p-8">
        <div data-map className="swatch sw-map h-[190px] w-full sm:h-[260px] lg:h-[460px]" />

        <p className="mt-4 max-w-xl text-[10.5px] leading-relaxed text-white/60 lg:text-[13px]">
          Every authenticated piece adds a quiet pin to the map — only a country or state, never who or exactly where.
        </p>
        <div className="mt-3 flex items-center justify-between rounded-full bg-white/10 px-4 py-2.5 lg:max-w-sm">
          <span className="text-[10.5px] text-white/70">Pieces authenticated</span>
          <span className="text-[13px] font-semibold">{total.toLocaleString('en-NG')}</span>
        </div>

        {map.isLoading ? <Loading /> : null}
        <ErrorMessage error={map.error} />
        <ul aria-label="Regions" className="mt-4 flex flex-wrap gap-2">
          {regions.map((r) => (
            <li key={`${r.country}-${r.state ?? ''}`} data-country={r.country} className="rounded-full border border-white/15 px-3 py-1 text-[10.5px] text-bg/80">
              {r.state ? `${r.state}, ` : ''}
              {r.country} · {r.count}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
