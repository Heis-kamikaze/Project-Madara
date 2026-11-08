import { Link, useSearchParams } from 'react-router-dom'
import { useVerifyPayment } from '../api/orders'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import { usePageTitle } from '../hooks/usePageTitle'

/** Paystack sends the customer back here with ?reference=… — confirm it with the API. */
export default function CheckoutCompletePage() {
  usePageTitle('Payment')
  const [params] = useSearchParams()
  const reference = params.get('reference') ?? params.get('trxref')
  const verify = useVerifyPayment(reference)

  if (!reference) {
    return (
      <section>
        <h1>Payment</h1>
        <p>We could not find a payment reference. If you were charged, check your orders or contact us.</p>
        <Link to="/account/orders">My orders</Link>
      </section>
    )
  }
  if (verify.isLoading) return <Loading label="Confirming your payment…" />
  if (verify.error) {
    return (
      <section>
        <h1>We could not confirm your payment</h1>
        <ErrorMessage error={verify.error} />
        <p>
          If you were charged, do not pay again. Your order will update automatically, or <Link to="/support">contact us</Link>.
        </p>
        <Link to="/account/orders">My orders</Link>
      </section>
    )
  }

  const result = verify.data
  if (result?.paid) {
    return (
      <section>
        <h1>Thank you — payment received</h1>
        <p>Order {result.orderNumber} is confirmed. We will update you in your inbox as it moves along.</p>
        <Link to={`/account/orders/${result.orderId}`}>View order</Link>
      </section>
    )
  }
  if (result?.status === 'needs_attention') {
    return (
      <section>
        <h1>We are reviewing your order</h1>
        <p>We received your payment for order {result.orderNumber} but need to check something. Our team will contact you shortly.</p>
        <Link to={`/account/orders/${result.orderId}`}>View order</Link>
      </section>
    )
  }
  return (
    <section>
      <h1>Payment not completed</h1>
      <p>Your payment for order {result?.orderNumber} did not go through. You can try again from the order page.</p>
      {result ? <Link to={`/account/orders/${result.orderId}`}>Back to the order</Link> : null}
    </section>
  )
}
