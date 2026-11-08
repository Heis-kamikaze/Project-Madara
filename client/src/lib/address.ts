import type { Address } from '../types/api'

/** Form state for an address: every field is a string so inputs stay controlled. */
export interface AddressDraft {
  fullName: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  country: string
  postalCode: string
}

export const emptyAddress: AddressDraft = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  country: 'Nigeria',
  postalCode: '',
}

export const toDraft = (a?: Address | null): AddressDraft => ({
  fullName: a?.fullName ?? '',
  phone: a?.phone ?? '',
  line1: a?.line1 ?? '',
  line2: a?.line2 ?? '',
  city: a?.city ?? '',
  state: a?.state ?? '',
  country: a?.country ?? 'Nigeria',
  postalCode: a?.postalCode ?? '',
})

/** Drops empty optional fields (the API rejects empty strings for them). */
export function toAddress(d: AddressDraft): Address {
  const address: Address = { line1: d.line1.trim(), city: d.city.trim(), state: d.state.trim(), country: d.country.trim() }
  if (d.fullName.trim()) address.fullName = d.fullName.trim()
  if (d.phone.trim()) address.phone = d.phone.trim()
  if (d.line2.trim()) address.line2 = d.line2.trim()
  if (d.postalCode.trim()) address.postalCode = d.postalCode.trim()
  return address
}
