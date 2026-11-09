import { useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useClaimPiece, useVerifyCode } from '../api/authenticity'
import { useAuth } from '../auth/useAuth'
import ErrorMessage from '../components/ui/ErrorMessage'
import Field from '../components/ui/Field'
import Loading from '../components/ui/Loading'
import Media from '../components/ui/Media'
import { usePageTitle } from '../hooks/usePageTitle'

const pill = 'mx-auto mt-5 inline-flex items-center gap-1.5 rounded-full bg-gold-light px-4 py-2 text-[11px] font-semibold text-espresso'

/** Opened by scanning the QR code on a piece's packaging: /verify/:code */
export default function VerifyPage() {
  const { code } = useParams()
  usePageTitle('Verify a piece')
  const { status } = useAuth()
  const location = useLocation()
  const verify = useVerifyCode(code)
  const claim = useClaimPiece()
  const [shareLocation, setShareLocation] = useState(false)
  const [country, setCountry] = useState('NG')
  const [state, setState] = useState('')

  if (verify.isLoading) return <Loading label="Checking this piece…" />
  if (verify.error) return <ErrorMessage error={verify.error} />

  const result = verify.data
  const claimed = claim.data?.data

  // After a successful claim the code is (correctly) "already claimed", so show success first.
  if (claimed && result?.valid) {
    return (
      <section className="mx-auto max-w-md pt-6 text-center lg:pt-14">
        <p className="eyebrow">Authentication</p>
        <h1 data-anim="reveal" className="mt-2 font-serif text-[22px] lg:text-[32px]">
          {claimed.alreadyClaimed ? 'You already own this piece' : 'Piece verified'}
        </h1>
        <p className={pill}>
          <span className="size-1.5 rounded-full bg-espresso" /> Piece Verified
        </p>
        <p className="mt-4 text-[11px] leading-[1.6] text-ink-faint">
          {result.title} is now linked to your Closet{claimed.locationRegistered ? ' and to the World of Aradam registry' : ''}.
        </p>
        <Link to={claimed.closetItemId ? `/closet/${claimed.closetItemId}` : '/closet'} className="btn mt-6">
          Open my closet
        </Link>
      </section>
    )
  }

  if (!result?.valid) {
    return (
      <section className="mx-auto max-w-md pt-6 text-center lg:pt-14">
        <p className="eyebrow">Authentication</p>
        <h1 className="mt-2 font-serif text-[22px] lg:text-[32px]">We could not verify this piece</h1>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">This code was not recognised. Check the QR code or the code printed on your packaging, or contact us if you think this is a mistake.</p>
        <Link to="/pieces" className="btn btn-outline btn-sm mt-6">
          Back to the atelier
        </Link>
      </section>
    )
  }

  function onClaim(e: FormEvent) {
    e.preventDefault()
    if (!code) return
    claim.mutate({
      code,
      shareLocation,
      country: shareLocation ? country.trim().toUpperCase() : undefined,
      state: shareLocation && state.trim() ? state.trim() : undefined,
    })
  }

  return (
    <section className="mx-auto max-w-md pt-4 text-center lg:pt-10">
      <p className="eyebrow">Authentication</p>
      <h1 data-anim="reveal" className="mt-2 font-serif text-[22px] lg:text-[32px]">
        Genuine Aradam piece
      </h1>
      <Media src={result.imageUrl} seed={code ?? 'code'} alt={result.title} className="mx-auto mt-5 aspect-[4/5] w-[200px]" />
      <h2 className="mt-4 font-serif text-[17px]">{result.title}</h2>
      {result.story ? <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">{result.story}</p> : null}
      <p className={pill}>
        <span className="size-1.5 rounded-full bg-espresso" /> {result.claimed ? 'Authenticated by its owner' : 'Piece Verified'}
      </p>

      {result.claimed ? null : status === 'signedIn' ? (
        <form onSubmit={onClaim} className="mt-6 text-left">
          <p className="text-center text-[12px] text-ink-soft">Add this piece to your private closet.</p>
          <label className="!flex items-start text-[11.5px] leading-relaxed text-ink-soft">
            <input type="checkbox" checked={shareLocation} onChange={(e) => setShareLocation(e.target.checked)} className="mt-0.5 flex-none" />
            <span className="!mb-0 !text-[11.5px] !normal-case !tracking-normal">Show my country/state on the Aradam map (only a count is stored, never who or exactly where)</span>
          </label>
          {shareLocation ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Country code" hint="2 letters, e.g. NG">
                <input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={2} pattern="[A-Za-z]{2}" required />
              </Field>
              <Field label="State (optional)">
                <input value={state} onChange={(e) => setState(e.target.value)} maxLength={60} />
              </Field>
            </div>
          ) : null}
          <button type="submit" disabled={claim.isPending} className="btn btn-block">
            {claim.isPending ? 'Authenticating…' : 'Add to my closet'}
          </button>
          <ErrorMessage error={claim.error} />
        </form>
      ) : (
        <p className="mt-6 text-[12px] text-ink-soft">
          <Link to={`/login?next=${encodeURIComponent(location.pathname)}`} className="underline underline-offset-4">Sign in</Link> or{' '}
          <Link to={`/register?next=${encodeURIComponent(location.pathname)}`} className="underline underline-offset-4">create an account</Link> to add this piece to your closet.
        </p>
      )}
    </section>
  )
}
