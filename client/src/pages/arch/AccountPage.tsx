// import { useState, type FormEvent } from 'react'
// import { Link } from 'react-router-dom'
// import { useUpdateProfile } from '../api/profile'
// import { useAuth } from '../auth/useAuth'
// import AddressForm from '../components/ui/AddressForm'
// import ErrorMessage from '../components/ui/ErrorMessage'
// import Field from '../components/ui/Field'
// import Loading from '../components/ui/Loading'
// import { usePageTitle } from '../hooks/usePageTitle'
// import { toAddress, toDraft, type AddressDraft } from '../lib/address'
// import type { AuthMe } from '../types/api'

// function ProfileForm({ me }: { me: AuthMe }) {
//   const { refresh } = useAuth()
//   const update = useUpdateProfile()
//   const [displayName, setDisplayName] = useState(me.profile?.displayName ?? '')
//   const [phone, setPhone] = useState(me.profile?.phone ?? '')
//   const [marketing, setMarketing] = useState(me.profile?.marketingOptIn ?? false)
//   const [address, setAddress] = useState<AddressDraft>(() => toDraft(me.profile?.address))
//   const [saved, setSaved] = useState(false)

//   async function onSubmit(e: FormEvent) {
//     e.preventDefault()
//     setSaved(false)
//     const hasAddress = address.line1.trim() && address.city.trim() && address.state.trim() && address.country.trim()
//     await update.mutateAsync({
//       displayName: displayName.trim() || undefined,
//       phone: phone.trim() || null,
//       marketingOptIn: marketing,
//       address: hasAddress ? toAddress(address) : null,
//     })
//     await refresh()
//     setSaved(true)
//   }

//   return (
//     <form onSubmit={onSubmit}>
//       <Field label="Name">
//         <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} autoComplete="name" />
//       </Field>
//       <Field label="Phone">
//         <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} autoComplete="tel" inputMode="tel" />
//       </Field>
//       <label>
//         <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} /> Send me news about new collections
//       </label>
//       <h2>Delivery address</h2>
//       <p>Saved here to speed up checkout. Leave it blank to remove it.</p>
//       <AddressForm value={address} onChange={setAddress} />
//       <button type="submit" disabled={update.isPending}>
//         {update.isPending ? 'Saving…' : 'Save changes'}
//       </button>
//       {saved ? <p role="status">Saved.</p> : null}
//       <ErrorMessage error={update.error} />
//     </form>
//   )
// }

// export default function AccountPage() {
//   usePageTitle('My account')
//   const { me, signOut } = useAuth()
//   if (!me) return <Loading />

//   return (
//     <section>
//       <h1>My account</h1>
//       <p>{me.email}</p>
//       <nav aria-label="Account">
//         <ul>
//           <li>
//             <Link to="/account/orders">My orders</Link>
//           </li>
//           <li>
//             <Link to="/account/consultations">My consultations</Link>
//           </li>
//           <li>
//             <Link to="/closet">My closet</Link>
//           </li>
//           <li>
//             <Link to="/account/inbox">Inbox</Link>
//           </li>
//         </ul>
//       </nav>
//       <ProfileForm me={me} />
//       <button type="button" onClick={() => void signOut()}>
//         Sign out
//       </button>
//     </section>
//   )
// }
