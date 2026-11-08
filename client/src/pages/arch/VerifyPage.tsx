// import { useState, type FormEvent } from 'react'
// import { Link, useLocation, useParams } from 'react-router-dom'
// import { useClaimPiece, useVerifyCode } from '../api/authenticity'
// import { useAuth } from '../auth/useAuth'
// import ErrorMessage from '../components/ui/ErrorMessage'
// import Field from '../components/ui/Field'
// import Loading from '../components/ui/Loading'
// import { usePageTitle } from '../hooks/usePageTitle'

// /** Opened by scanning the QR code on a piece's packaging: /verify/:code */
// export default function VerifyPage() {
//   const { code } = useParams()
//   usePageTitle('Verify a piece')
//   const { status } = useAuth()
//   const location = useLocation()
//   const verify = useVerifyCode(code)
//   const claim = useClaimPiece()
//   const [shareLocation, setShareLocation] = useState(false)
//   const [country, setCountry] = useState('NG')
//   const [state, setState] = useState('')

//   if (verify.isLoading) return <Loading label="Checking this piece…" />
//   if (verify.error) return <ErrorMessage error={verify.error} />

//   const result = verify.data
//   const claimed = claim.data?.data

//   // Success view first: after claiming, the code is (correctly) "already claimed".
//   if (claimed && result?.valid) {
//     return (
//       <section>
//         <h1>{claimed.alreadyClaimed ? 'You already own this piece' : 'Authenticated'}</h1>
//         <p>{result.title} is verified as a genuine Aradam piece and is in your closet.</p>
//         {claimed.locationRegistered ? <p>Thank you for adding your region to the Aradam map.</p> : null}
//         <Link to={claimed.closetItemId ? `/closet/${claimed.closetItemId}` : '/closet'}>Open my closet</Link>
//       </section>
//     )
//   }

//   if (!result?.valid) {
//     return (
//       <section>
//         <h1>We could not verify this piece</h1>
//         <p>This code was not recognised. Check the QR code or code printed on your packaging, or contact us if you think this is a mistake.</p>
//         <Link to="/support">Talk to us</Link>
//       </section>
//     )
//   }

//   function onClaim(e: FormEvent) {
//     e.preventDefault()
//     if (!code) return
//     claim.mutate({
//       code,
//       shareLocation,
//       country: shareLocation ? country.trim().toUpperCase() : undefined,
//       state: shareLocation && state.trim() ? state.trim() : undefined,
//     })
//   }

//   return (
//     <section>
//       <h1>Genuine Aradam piece</h1>
//       {result.imageUrl ? <img src={result.imageUrl} alt={result.title} /> : null}
//       <h2>{result.title}</h2>
//       {result.story ? <p>{result.story}</p> : null}

//       {result.claimed ? (
//         <p>This piece has already been authenticated by its owner.</p>
//       ) : status === 'signedIn' ? (
//         <form onSubmit={onClaim}>
//           <p>Add this piece to your private closet.</p>
//           <label>
//             <input type="checkbox" checked={shareLocation} onChange={(e) => setShareLocation(e.target.checked)} /> Show my country/state on the Aradam map
//             (only a count is stored, never who or exactly where)
//           </label>
//           {shareLocation ? (
//             <>
//               <Field label="Country code" hint="2 letters, e.g. NG">
//                 <input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={2} pattern="[A-Za-z]{2}" required />
//               </Field>
//               <Field label="State / region (optional)">
//                 <input value={state} onChange={(e) => setState(e.target.value)} maxLength={60} />
//               </Field>
//             </>
//           ) : null}
//           <button type="submit" disabled={claim.isPending}>
//             {claim.isPending ? 'Authenticating…' : 'Authenticate and add to my closet'}
//           </button>
//           <ErrorMessage error={claim.error} />
//         </form>
//       ) : (
//         <p>
//           <Link to={`/login?next=${encodeURIComponent(location.pathname)}`}>Sign in</Link> or <Link to={`/register?next=${encodeURIComponent(location.pathname)}`}>create an account</Link>{' '}
//           to add this piece to your closet.
//         </p>
//       )}
//     </section>
//   )
// }
