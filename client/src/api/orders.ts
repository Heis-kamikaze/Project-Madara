import { api } from '../lib/api'
import type { Address, InitializedPayment, Order, OrderStatus, PaymentVerification } from '../types/api'
import { useApiMutation, useGet, usePaged } from './query'

export type NewOrder = {
  items: { productId: string; quantity: number; size?: string }[]
  shippingAddress: Address
  notes?: string
}

export const useCreateOrder = () => useApiMutation((body: NewOrder) => api.post<Order>('/orders', body), [['orders']])

export const useMyOrders = () => usePaged<Order>(['orders', 'mine'], '/orders/mine', { limit: 20 })

export const useOrder = (id: string | undefined) =>
  useGet<Order>(['orders', 'one', id], `/orders/${id}`, undefined, { enabled: !!id })

export const useCancelOrder = () => useApiMutation((id: string) => api.post<Order>(`/orders/${id}/cancel`), [['orders']])

/** Starts a Paystack checkout. Redirect the browser to `authorizationUrl`. */
export const startPayment = async (orderId: string): Promise<InitializedPayment> =>
  (await api.post<InitializedPayment>('/payments/initialize', { orderId })).data

/** Confirms a payment with Paystack (via the API) after the customer returns from checkout. */
export const useVerifyPayment = (reference: string | null) =>
  useGet<PaymentVerification>(['payments', 'verify', reference], `/payments/verify/${encodeURIComponent(reference ?? '')}`, undefined, {
    enabled: !!reference,
  })

// ── Staff ──
export const useAllOrders = (status?: OrderStatus) => usePaged<Order>(['orders', 'all'], '/orders', { status, limit: 25 })

export type StaffOrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export const useUpdateOrderStatus = () =>
  useApiMutation(
    (v: { id: string; status: StaffOrderStatus; note?: string }) =>
      api.patch<Order>(`/orders/${v.id}/status`, { status: v.status, note: v.note }),
    [['orders']],
  )
