import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollections } from '../../api/collections'
import { useDeleteProduct, useProducts } from '../../api/products'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Loading from '../../components/ui/Loading'
import StatusBadge from '../../components/ui/StatusBadge'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatNaira } from '../../lib/format'

export default function AdminProductsPage() {
  usePageTitle('Pieces · Admin')
  const [collectionId, setCollectionId] = useState('')
  const collections = useCollections({ status: 'all' })
  const { data, isLoading, error } = useProducts({ status: 'all', collectionId: collectionId || undefined, sort: 'date', order: 'desc', limit: 200 })
  const remove = useDeleteProduct()

  return (
    <div>
      <h1>Pieces</h1>
      <p>
        <Link to="/admin/pieces/new">New piece</Link>
      </p>
      <label>
        <span>Collection</span>
        <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
          <option value="">All</option>
          {collections.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </label>
      {isLoading ? <Loading /> : null}
      <ErrorMessage error={error ?? remove.error} />
      <table>
        <thead>
          <tr>
            <th>Piece</th>
            <th>Collection</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data?.map((p) => (
            <tr key={p.id}>
              <td>
                <Link to={`/admin/pieces/${p.id}`}>{p.title}</Link>
              </td>
              <td>{p.collection?.title ?? '—'}</td>
              <td>{formatNaira(p.priceNgn)}</td>
              <td>{p.stock}</td>
              <td>
                <StatusBadge status={p.status} />
              </td>
              <td>
                {p.status === 'draft' ? (
                  <button type="button" onClick={() => window.confirm(`Delete "${p.title}"?`) && remove.mutate(p.id)}>
                    Delete
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
