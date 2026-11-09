import { Link, useSearchParams } from 'react-router-dom'
import { useVerifyPayment } from '../api/orders'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import { usePageTitle } from '../hooks/usePageTitle'

const wrap = 'mx-auto max-w-md pt-8 text-center lg:pt-16'

/** Paystack sends the customer back here with ?reference=… — confirm it with the API. */
export default function CheckoutCompletePage() {
  usePageTitle('Payment')
  const [params] = useSearchParams()
  const reference = params.get('reference') ?? params.get('trxref')
  const verify = useVerifyPayment(reference)

  if (!reference) {
    return (
      <section className={wrap}>
        <h1 className="font-serif text-[24px]">Payment</h1>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">We could not find a payment reference. If you were charged, check your orders or contact us.</p>
        <Link to="/account/orders" className="btn btn-outline btn-sm mt-6">My orders</Link>
      </section>
    )
  }
  if (verify.isLoading) return <Loading label="Confirming your payment…" />
  if (verify.error) {
    return (
      <section className={wrap}>
        <h1 className="font-serif text-[24px]">We could not confirm your payment</h1>
        <ErrorMessage error={verify.error} />
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">If you were charged, do not pay again. Your order will update automatically.</p>
        <Link to="/account/orders" className="btn btn-outline btn-sm mt-6">My orders</Link>
      </section>
    )
  }

  const result = verify.data
  if (result?.paid) {
    return (
      <section className={wrap}>
        <p className="eyebrow">Thank you</p>
        <h1 data-anim="reveal" className="mt-2 font-serif text-[26px]">Payment received</h1>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">Order {result.orderNumber} is confirmed. We will update you in your inbox as it moves along.</p>
        <Link to={`/account/orders/${result.orderId}`} className="btn mt-6">View order</Link>
      </section>
    )
  }
  if (result?.status === 'needs_attention') {
    return (
      <section className={wrap}>
        <h1 className="font-serif text-[24px]">We are reviewing your order</h1>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">We received your payment for order {result.orderNumber} but need to check something. Our team will contact you shortly.</p>
        <Link to={`/account/orders/${result.orderId}`} className="btn btn-outline btn-sm mt-6">View order</Link>
      </section>
    )
  }
  return (
    <section className={wrap}>
      <h1 className="font-serif text-[24px]">Payment not completed</h1>
      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">Your payment for order {result?.orderNumber} did not go through. You can try again from the order page.</p>
      {result ? <Link to={`/account/orders/${result.orderId}`} className="btn mt-6">Back to the order</Link> : null}
    </section>
  )
}
