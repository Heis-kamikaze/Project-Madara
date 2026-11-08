import { useMapRegions } from '../api/authenticity'
import { useTeam } from '../api/team'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import { usePageTitle } from '../hooks/usePageTitle'
import type { TeamNode } from '../types/api'

function OrgNode({ node }: { node: TeamNode }) {
  return (
    <li>
      <strong>{node.name}</strong> — {node.title}
      {node.children.length > 0 ? (
        <ul>
          {node.children.map((child) => (
            <OrgNode key={child.id} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

/** Team portraits, the organisational chart and the brand's global reach. */
export default function TeamPage() {
  usePageTitle('Team')
  const team = useTeam()
  const map = useMapRegions()
  const regions = map.data?.data ?? []
  const total = typeof map.data?.meta?.total === 'number' ? map.data.meta.total : 0

  return (
    <section>
      <h1>Team</h1>
      {team.isLoading ? <Loading /> : null}
      <ErrorMessage error={team.error} />

      <ul aria-label="Core team">
        {team.data?.members.map((m) => (
          <li key={m.id}>
            <figure>
              {m.portraitUrl ? <img src={m.portraitUrl} alt={m.name} loading="lazy" /> : null}
              <figcaption>
                <strong>{m.name}</strong>
                <br />
                {m.title}
              </figcaption>
            </figure>
            {m.bio ? <p>{m.bio}</p> : null}
          </li>
        ))}
      </ul>

      {team.data && team.data.tree.length > 0 ? (
        <>
          <h2>Who reports to whom</h2>
          <ul aria-label="Organisation chart">
            {team.data.tree.map((node) => (
              <OrgNode key={node.id} node={node} />
            ))}
          </ul>
        </>
      ) : null}

      <h2>Where Aradam pieces live</h2>
      {/*
        Data for an interactive map: one entry per country/state with an anonymous count.
        Plug it into your map library of choice (country codes are ISO 3166-1 alpha-2).
      */}
      {map.isLoading ? <Loading /> : null}
      <p>{total} authenticated pieces worldwide</p>
      <ul aria-label="Regions">
        {regions.map((r) => (
          <li key={`${r.country}-${r.state ?? ''}`} data-country={r.country}>
            {r.state ? `${r.state}, ` : ''}
            {r.country}: {r.count}
          </li>
        ))}
      </ul>
    </section>
  )
}
