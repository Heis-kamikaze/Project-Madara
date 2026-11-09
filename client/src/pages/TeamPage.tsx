import { useTeam } from '../api/team'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import Media from '../components/ui/Media'
import { usePageTitle } from '../hooks/usePageTitle'
import type { TeamNode } from '../types/api'

function OrgNode({ node }: { node: TeamNode }) {
  return (
    <li className="relative">
      <span className="inline-block rounded-md border border-line bg-white/60 px-3 py-1.5 text-[11px]">
        <strong className="font-semibold">{node.title}</strong>
        <span className="text-ink-faint"> · {node.name}</span>
      </span>
      {node.children.length > 0 ? (
        <ul className="ml-4 mt-2 space-y-2 border-l border-line pl-4">
          {node.children.map((child) => (
            <OrgNode key={child.id} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

/** Uniformed portraits, job titles and a simple organogram. */
export default function TeamPage() {
  usePageTitle('The Team')
  const team = useTeam()
  return (
    <section className="pt-2 lg:pt-6">
      <h1 className="sr-only">The Team</h1>
      {team.isLoading ? <Loading /> : null}
      <ErrorMessage error={team.error} />

      <ul data-anim="stagger" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {team.data?.members.map((m, i) => (
          <li key={m.id}>
            <figure>
              <Media src={m.portraitUrl} seed={`portrait-${i}`} alt={m.name} className="aspect-[4/5] w-full !bg-ink" />
              <figcaption className="mt-1.5">
                <span className="block text-[11px] font-semibold lg:text-[13px]">{m.name}</span>
                <span className="block text-[9.5px] text-ink-faint lg:text-[11px]">{m.title}</span>
              </figcaption>
            </figure>
            {m.bio ? <p className="mt-1 hidden text-[11px] leading-relaxed text-ink-soft lg:block">{m.bio}</p> : null}
          </li>
        ))}
      </ul>

      {team.data && team.data.tree.length > 0 ? (
        <div className="mt-10">
          <div className="divider" />
          <p className="tag mb-3">Organogram</p>
          <ul aria-label="Organisation chart" className="space-y-2">
            {team.data.tree.map((node) => (
              <OrgNode key={node.id} node={node} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
