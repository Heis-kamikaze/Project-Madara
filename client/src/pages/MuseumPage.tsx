import { useMuseum } from '../api/museum'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import Media from '../components/ui/Media'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatMonthYear } from '../lib/format'

/** Curated pieces shown as objects, not products: story and date only. */
export default function MuseumPage() {
  usePageTitle('Museum')
  const { data, isLoading, error } = useMuseum()
  return (
    <section className="pt-2 lg:pt-6">
      <h1 className="sr-only">Museum</h1>
      {isLoading ? <Loading /> : null}
      <ErrorMessage error={error} />
      {data && data.length === 0 ? <p className="font-serif text-[15px] italic text-ink-soft">The museum is being curated. Check back soon.</p> : null}
      <ul data-anim="stagger" className="grid gap-10 md:grid-cols-2 lg:gap-14">
        {data?.map((entry) => (
          <li key={entry.id}>
            <article>
              <Media src={entry.imageUrls[0]} seed={entry.id} alt={entry.title} className="aspect-[5/4] w-full !bg-bg-alt" />
              {entry.imageUrls.length > 1 ? (
                <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
                  {entry.imageUrls.slice(1).map((url) => (
                    <img key={url} src={url} alt={entry.title} loading="lazy" className="size-20 flex-none rounded object-cover" />
                  ))}
                </div>
              ) : null}
              <h2 className="mt-3 font-serif text-[18px]">{entry.title}</h2>
              {entry.story ? <p className="mt-1.5 text-[12px] leading-[1.7] text-ink-soft lg:text-[14px]">{entry.story}</p> : null}
              <p className="tag mt-2.5">{formatMonthYear(entry.createdAt)}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
