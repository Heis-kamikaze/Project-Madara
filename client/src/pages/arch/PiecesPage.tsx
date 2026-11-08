// import { useState, type FormEvent } from 'react'
// import { useProducts, type ProductFilters } from '../api/products'
// import ErrorMessage from '../components/ui/ErrorMessage'
// import Loading from '../components/ui/Loading'
// import ProductCard from '../components/ui/ProductCard'
// import { usePageTitle } from '../hooks/usePageTitle'

// interface Draft {
//   q: string
//   minPrice: string
//   maxPrice: string
//   from: string
//   to: string
//   sort: NonNullable<ProductFilters['sort']>
//   order: 'asc' | 'desc'
//   archived: boolean
// }

// const initial: Draft = { q: '', minPrice: '', maxPrice: '', from: '', to: '', sort: 'release', order: 'desc', archived: false }

// /** All single pieces, with filters for price, release date and sorting. */
// export default function PiecesPage() {
//   usePageTitle('Pieces')
//   const [draft, setDraft] = useState<Draft>(initial)
//   const [applied, setApplied] = useState<Draft>(initial)

//   const { data, isLoading, error } = useProducts({
//     status: applied.archived ? 'archived' : undefined,
//     q: applied.q || undefined,
//     minPrice: applied.minPrice ? Number(applied.minPrice) : undefined,
//     maxPrice: applied.maxPrice ? Number(applied.maxPrice) : undefined,
//     releasedFrom: applied.from ? new Date(`${applied.from}T00:00:00`).toISOString() : undefined,
//     releasedTo: applied.to ? new Date(`${applied.to}T23:59:59`).toISOString() : undefined,
//     sort: applied.sort,
//     order: applied.order,
//   })

//   const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

//   function apply(e: FormEvent) {
//     e.preventDefault()
//     setApplied(draft)
//   }

//   return (
//     <section>
//       <h1>{applied.archived ? 'Archived pieces' : 'Pieces'}</h1>

//       <form onSubmit={apply} aria-label="Filter pieces">
//         <label>
//           <span>Search</span>
//           <input type="search" value={draft.q} onChange={(e) => set('q', e.target.value)} />
//         </label>
//         <label>
//           <span>Min price (₦)</span>
//           <input type="number" min={0} value={draft.minPrice} onChange={(e) => set('minPrice', e.target.value)} />
//         </label>
//         <label>
//           <span>Max price (₦)</span>
//           <input type="number" min={0} value={draft.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} />
//         </label>
//         <label>
//           <span>Released from</span>
//           <input type="date" value={draft.from} onChange={(e) => set('from', e.target.value)} />
//         </label>
//         <label>
//           <span>Released until</span>
//           <input type="date" value={draft.to} onChange={(e) => set('to', e.target.value)} />
//         </label>
//         <label>
//           <span>Sort by</span>
//           <select value={draft.sort} onChange={(e) => set('sort', e.target.value as Draft['sort'])}>
//             <option value="release">Release date</option>
//             <option value="price">Price</option>
//             <option value="date">Date added</option>
//           </select>
//         </label>
//         <label>
//           <span>Order</span>
//           <select value={draft.order} onChange={(e) => set('order', e.target.value as Draft['order'])}>
//             <option value="desc">Descending</option>
//             <option value="asc">Ascending</option>
//           </select>
//         </label>
//         <label>
//           <input type="checkbox" checked={draft.archived} onChange={(e) => set('archived', e.target.checked)} /> Show archived pieces
//         </label>
//         <button type="submit">Apply filters</button>
//         <button
//           type="button"
//           onClick={() => {
//             setDraft(initial)
//             setApplied(initial)
//           }}
//         >
//           Reset
//         </button>
//       </form>

//       {isLoading ? <Loading /> : null}
//       <ErrorMessage error={error} />
//       {data && data.length === 0 ? <p>No pieces match these filters.</p> : null}
//       <ul>
//         {data?.map((p) => (
//           <li key={p.id}>
//             <ProductCard slug={p.slug} title={p.title} priceNgn={p.priceNgn} imageUrl={p.imageUrls[0]} status={p.status} />
//           </li>
//         ))}
//       </ul>
//     </section>
//   )
// }
