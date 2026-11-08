import type { AddressDraft } from '../../lib/address'
import Field from './Field'

interface Props {
  value: AddressDraft
  onChange: (next: AddressDraft) => void
}

export default function AddressForm({ value, onChange }: Props) {
  const set = (key: keyof AddressDraft) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [key]: e.target.value })
  return (
    <>
      <Field label="Full name">
        <input value={value.fullName} onChange={set('fullName')} autoComplete="name" />
      </Field>
      <Field label="Phone">
        <input value={value.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" />
      </Field>
      <Field label="Address line 1">
        <input value={value.line1} onChange={set('line1')} autoComplete="address-line1" required />
      </Field>
      <Field label="Address line 2">
        <input value={value.line2} onChange={set('line2')} autoComplete="address-line2" />
      </Field>
      <Field label="City">
        <input value={value.city} onChange={set('city')} autoComplete="address-level2" required />
      </Field>
      <Field label="State">
        <input value={value.state} onChange={set('state')} autoComplete="address-level1" required />
      </Field>
      <Field label="Country">
        <input value={value.country} onChange={set('country')} autoComplete="country-name" required />
      </Field>
      <Field label="Postal code">
        <input value={value.postalCode} onChange={set('postalCode')} autoComplete="postal-code" />
      </Field>
    </>
  )
}
