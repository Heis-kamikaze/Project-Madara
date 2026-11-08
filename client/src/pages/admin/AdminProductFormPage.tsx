import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCollections } from '../../api/collections'
import { uploadMedia } from '../../api/media'
import { useCreateProduct, useProduct, useUpdateProduct, type ProductInput } from '../../api/products'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Field from '../../components/ui/Field'
import ImageUploader from '../../components/ui/ImageUploader'
import Loading from '../../components/ui/Loading'
import { usePageTitle } from '../../hooks/usePageTitle'
import { fromLocalInput, toLocalInput } from '../../lib/format'
import type { Product } from '../../types/api'

function ProductForm({ initial }: { initial: Product | null }) {
  const navigate = useNavigate()
  const collections = useCollections({ status: 'all' })
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const [collectionId, setCollectionId] = useState(initial?.collectionId ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [story, setStory] = useState(initial?.story ?? '')
  const [price, setPrice] = useState(initial ? String(initial.priceNgn) : '')
  const [colorName, setColorName] = useState(initial?.colorName ?? '')
  const [colorHex, setColorHex] = useState(initial?.colorHex ?? '')
  const [sizes, setSizes] = useState(initial?.sizes.join(', ') ?? '')
  const [images, setImages] = useState<string[]>(initial?.imageUrls ?? [])
  const [stock, setStock] = useState(initial ? String(initial.stock) : '1')
  const [status, setStatus] = useState<ProductInput['status']>(initial ? (initial.status === 'sold_out' ? 'active' : initial.status) : 'draft')
  const [releaseAt, setReleaseAt] = useState(toLocalInput(initial?.releaseAt))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const body: ProductInput = {
      collectionId: collectionId || null,
      title: title.trim(),
      slug: slug.trim() || undefined,
      story: story.trim(),
      priceNgn: Math.round(Number(price)),
      colorName: colorName.trim(),
      colorHex: colorHex.trim() || null,
      sizes: sizes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      imageUrls: images,
      stock: Math.round(Number(stock)),
      status,
      releaseAt: fromLocalInput(releaseAt),
    }
    if (initial) await update.mutateAsync({ id: initial.id, patch: body })
    else await create.mutateAsync(body)
    navigate('/admin/pieces')
  }

  return (
    <div>
      <p>
        <Link to="/admin/pieces">← Pieces</Link>
      </p>
      <h1>{initial ? `Edit “${initial.title}”` : 'New piece'}</h1>
      <p>Pieces in a collection have a fixed colour and design. Customers cannot change them when ordering.</p>
      <form onSubmit={onSubmit}>
        <Field label="Collection" hint="Leave empty for a standalone piece">
          <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
            <option value="">No collection</option>
            {collections.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.status})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
        </Field>
        <Field label="URL name (optional)">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} maxLength={80} pattern="[a-z0-9\-]+" />
        </Field>
        <Field label="Story">
          <textarea value={story} onChange={(e) => setStory(e.target.value)} maxLength={10000} rows={5} />
        </Field>
        <Field label="Price (₦)">
          <input type="number" min={0} step={1} value={price} onChange={(e) => setPrice(e.target.value)} required />
        </Field>
        <Field label="Colour name">
          <input value={colorName} onChange={(e) => setColorName(e.target.value)} maxLength={40} required />
        </Field>
        <Field label="Colour hex (optional)" hint="e.g. #1a1a1a">
          <input value={colorHex} onChange={(e) => setColorHex(e.target.value)} pattern="#[0-9a-fA-F]{6}" placeholder="#000000" />
        </Field>
        <Field label="Sizes (optional)" hint="Comma separated, e.g. S, M, L. Leave empty if the piece has no sizes.">
          <input value={sizes} onChange={(e) => setSizes(e.target.value)} />
        </Field>
        <ImageUploader label="Photos" value={images} onChange={setImages} upload={(f) => uploadMedia('products', f)} max={12} />
        <Field label="Stock">
          <input type="number" min={0} step={1} value={stock} onChange={(e) => setStock(e.target.value)} required />
        </Field>
        <Field label="Status" hint="Stock 0 shows as sold out automatically.">
          <select value={status} onChange={(e) => setStatus(e.target.value as ProductInput['status'])}>
            <option value="draft">Draft (hidden)</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
        <Field label="Release date (optional)">
          <input type="datetime-local" value={releaseAt} onChange={(e) => setReleaseAt(e.target.value)} />
        </Field>
        <button type="submit" disabled={create.isPending || update.isPending}>
          {create.isPending || update.isPending ? 'Saving…' : 'Save'}
        </button>
      </form>
      <ErrorMessage error={create.error ?? update.error} />
    </div>
  )
}

export default function AdminProductFormPage() {
  const { id } = useParams()
  const existing = useProduct(id)
  usePageTitle(id ? 'Edit piece · Admin' : 'New piece · Admin')

  if (id && existing.isLoading) return <Loading />
  if (id && (existing.error || !existing.data)) return <ErrorMessage error={existing.error ?? new Error('Piece not found')} />
  return <ProductForm key={id ?? 'new'} initial={existing.data ?? null} />
}
