import { useState, type FormEvent } from 'react'
import { useAuthenticityCodes, useGenerateCodes } from '../../api/authenticity'
import { useProducts } from '../../api/products'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Field from '../../components/ui/Field'
import Loading from '../../components/ui/Loading'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate } from '../../lib/format'

/** Generate QR codes to print on packaging. Each code authenticates exactly one physical piece. */
export default function AdminAuthenticityPage() {
  usePageTitle('QR codes · Admin')
  const products = useProducts({ status: 'all', limit: 200, sort: 'date', order: 'desc' })
  const codes = useAuthenticityCodes()
  const generate = useGenerateCodes()
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    await generate.mutateAsync({ productId, quantity: Math.min(50, Math.max(1, Math.round(Number(quantity)))) })
  }

  return (
    <div>
      <h1>QR codes</h1>
      <form onSubmit={onSubmit}>
        <Field label="Piece">
          <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
            <option value="">Choose a piece</option>
            {products.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="How many codes?" hint="Up to 50 at a time">
          <input type="number" min={1} max={50} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        </Field>
        <button type="submit" disabled={generate.isPending}>
          {generate.isPending ? 'Generating…' : 'Generate codes'}
        </button>
        <ErrorMessage error={generate.error} />
      </form>

      <h2>Recent codes</h2>
      <button type="button" onClick={() => window.print()}>
        Print this page
      </button>
      {codes.isLoading ? <Loading /> : null}
      <ErrorMessage error={codes.error} />
      <ul>
        {codes.data?.map((c) => (
          <li key={c.id} data-status={c.status}>
            <img src={c.qrUrl} alt={`QR code ${c.code}`} width={120} height={120} />
            <p>
              <code>{c.code}</code>
            </p>
            <p>
              {c.title} · {c.status === 'claimed' ? 'claimed' : 'unclaimed'} · {formatDate(c.createdAt)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
