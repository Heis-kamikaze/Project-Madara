import { useState, type FormEvent } from 'react'
import { uploadMedia } from '../../api/media'
import { useCreateTeamMember, useDeleteTeamMember, useTeam, useUpdateTeamMember, type TeamInput } from '../../api/team'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Field from '../../components/ui/Field'
import ImageUploader from '../../components/ui/ImageUploader'
import Loading from '../../components/ui/Loading'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { TeamMember } from '../../types/api'

function TeamForm({ initial, members, onDone }: { initial: TeamMember | null; members: TeamMember[]; onDone: () => void }) {
  const create = useCreateTeamMember()
  const update = useUpdateTeamMember()
  const [name, setName] = useState(initial?.name ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [bio, setBio] = useState(initial?.bio ?? '')
  const [portrait, setPortrait] = useState<string[]>(initial?.portraitUrl ? [initial.portraitUrl] : [])
  const [parentId, setParentId] = useState(initial?.parentId ?? '')
  const [order, setOrder] = useState(String(initial?.order ?? 0))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const body: TeamInput = {
      name: name.trim(),
      title: title.trim(),
      bio: bio.trim() || null,
      portraitUrl: portrait[0] ?? null,
      parentId: parentId || null,
      order: Math.max(0, Math.round(Number(order))),
    }
    if (initial) await update.mutateAsync({ id: initial.id, patch: body })
    else await create.mutateAsync(body)
    onDone()
  }

  return (
    <form onSubmit={onSubmit}>
      <h2>{initial ? `Edit ${initial.name}` : 'New team member'}</h2>
      <Field label="Name">
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
      </Field>
      <Field label="Role / title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
      </Field>
      <Field label="Bio">
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={2000} rows={3} />
      </Field>
      <ImageUploader label="Portrait" value={portrait} onChange={(urls) => setPortrait(urls.slice(-1))} upload={(f) => uploadMedia('team', f)} max={1} />
      <Field label="Reports to">
        <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <option value="">Nobody (top of the chart)</option>
          {members
            .filter((m) => m.id !== initial?.id)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
        </select>
      </Field>
      <Field label="Position" hint="Lower numbers come first">
        <input type="number" min={0} value={order} onChange={(e) => setOrder(e.target.value)} />
      </Field>
      <button type="submit" disabled={create.isPending || update.isPending}>
        Save
      </button>
      <button type="button" onClick={onDone}>
        Cancel
      </button>
      <ErrorMessage error={create.error ?? update.error} />
    </form>
  )
}

export default function AdminTeamPage() {
  usePageTitle('Team · Admin')
  const team = useTeam()
  const remove = useDeleteTeamMember()
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const members = team.data?.members ?? []
  const current = members.find((m) => m.id === editing) ?? null

  return (
    <div>
      <h1>Team</h1>
      {editing ? (
        <TeamForm key={editing} initial={current} members={members} onDone={() => setEditing(null)} />
      ) : (
        <button type="button" onClick={() => setEditing('new')}>
          Add a team member
        </button>
      )}
      {team.isLoading ? <Loading /> : null}
      <ErrorMessage error={team.error ?? remove.error} />
      <ul>
        {members.map((m) => (
          <li key={m.id}>
            {m.name} — {m.title}{' '}
            <button type="button" onClick={() => setEditing(m.id)}>
              Edit
            </button>
            <button type="button" onClick={() => window.confirm(`Remove ${m.name}?`) && remove.mutate(m.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
