import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useUpdateProfile } from '../api/profile'
import { useAuth } from '../auth/useAuth'
import AddressForm from '../components/ui/AddressForm'
import ErrorMessage from '../components/ui/ErrorMessage'
import Field from '../components/ui/Field'
import Loading from '../components/ui/Loading'
import { usePageTitle } from '../hooks/usePageTitle'
import { toAddress, toDraft, type AddressDraft } from '../lib/address'
import type { AuthMe } from '../types/api'

function ProfileForm({ me }: { me: AuthMe }) {
  const { refresh } = useAuth()
  const update = useUpdateProfile()
  const [displayName, setDisplayName] = useState(me.profile?.displayName ?? '')
  const [phone, setPhone] = useState(me.profile?.phone ?? '')
  const [marketing, setMarketing] = useState(me.profile?.marketingOptIn ?? false)
  const [address, setAddress] = useState<AddressDraft>(() => toDraft(me.profile?.address))
  const [saved, setSaved] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaved(false)
    const hasAddress = address.line1.trim() && address.city.trim() && address.state.trim() && address.country.trim()
    await update.mutateAsync({
      displayName: displayName.trim() || undefined,
      phone: phone.trim() || null,
      marketingOptIn: marketing,
      address: hasAddress ? toAddress(address) : null,
    })
    await refresh()
    setSaved(true)
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-[18px] sm:grid-cols-2">
        <Field label="Name">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} autoComplete="name" />
        </Field>
        <Field label="Phone">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} autoComplete="tel" inputMode="tel" />
        </Field>
      </div>
      <label className="text-[12px] text-ink-soft">
        <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
        Send me news about new collections
      </label>
      <h2 className="mt-2 font-serif text-[18px]">Delivery address</h2>
      <p className="-mt-3 text-[11.5px] text-ink-faint">Saved here to speed up checkout. Leave it blank to remove it.</p>
      <AddressForm value={address} onChange={setAddress} />
      <button type="submit" disabled={update.isPending} className="btn self-start">
        {update.isPending ? 'Saving…' : 'Save changes'}
      </button>
      {saved ? <p role="status">Saved.</p> : null}
      <ErrorMessage error={update.error} />
    </form>
  )
}

const rowClass = 'flex items-center justify-between py-3.5 text-[13px] hover:text-gold'

export default function AccountPage() {
  usePageTitle('Account')
  const { me, signOut } = useAuth()
  if (!me) return <Loading />

  return (
    <section className="pt-2 lg:mx-auto lg:max-w-2xl lg:pt-6">
      <h1 className="sr-only">My account</h1>
      <p className="font-serif text-[22px]">{me.profile?.displayName ?? me.email}</p>
      <p className="mt-0.5 text-[11.5px] text-ink-faint">{me.email}</p>

      <nav aria-label="Account" className="mt-6">
        <ul className="divide-y divide-line border-y border-line">
          <li><Link to="/account/orders" className={rowClass}>My orders <span aria-hidden="true">→</span></Link></li>
          <li><Link to="/account/consultations" className={rowClass}>Private salon bookings <span aria-hidden="true">→</span></Link></li>
          <li><Link to="/closet" className={rowClass}>My closet <span aria-hidden="true">→</span></Link></li>
          <li><Link to="/account/inbox" className={rowClass}>Inbox <span aria-hidden="true">→</span></Link></li>
        </ul>
      </nav>

      <h2 className="mb-4 mt-10 font-serif text-[18px]">Your details</h2>
      <ProfileForm me={me} />
      <button type="button" onClick={() => void signOut()} className="btn btn-outline btn-sm mt-8">
        Sign out
      </button>
    </section>
  )
}
