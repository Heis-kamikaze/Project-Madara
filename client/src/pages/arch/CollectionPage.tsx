// import { useState } from 'react'
// import { useParams } from 'react-router-dom'
// import { useCollection } from '../api/collections'
// import { useProducts } from '../api/products'
// import ErrorMessage from '../components/ui/ErrorMessage'
// import HelpLink from '../components/ui/HelpLink'
// import Loading from '../components/ui/Loading'
// import ProductCard from '../components/ui/ProductCard'
// import { usePageTitle } from '../hooks/usePageTitle'
// import { formatDate } from '../lib/format'

// export default function CollectionPage() {
//   const { idOrSlug } = useParams()
//   const { data, isLoading, error } = useCollection(idOrSlug)
//   const collection = data?.collection
//   usePageTitle(collection?.title ?? 'Collection')

//   const [minPrice, setMinPrice] = useState('')
//   const [maxPrice, setMaxPrice] = useState('')
//   const [sort, setSort] = useState<'price' | 'date' | 'release'>('release')
//   const [order, setOrder] = useState<'asc' | 'desc'>('asc')

//   const pieces = useProducts(
//     {
//       collectionId: collection?.id,
//       status: 'all',
//       minPrice: minPrice ? Number(minPrice) : undefined,
//       maxPrice: maxPrice ? Number(maxPrice) : undefined,
//       sort,
//       order,
//     },
//     !!collection,
//   )

//   if (isLoading) return <Loading />
//   if (error || !collection) return <ErrorMessage error={error ?? new Error('Collection not found')} />

//   return (
//     <article>
//       {collection.coverImageUrl ? <img src={collection.coverImageUrl} alt="" /> : null}
//       <h1>{collection.title}</h1>
//       {collection.story ? <p>{collection.story}</p> : null}

//       {collection.status === 'archived' ? (
//         <aside role="note">
//           <p>
//             This collection has been archived{collection.archiveReason === 'sold_out' ? ' because every piece sold out' : ''} and can no longer be
//             ordered.
//           </p>
//           <HelpLink about={collection.title} />
//         </aside>
//       ) : collection.availability === 'upcoming' ? (
//         <p>Opens {formatDate(collection.availableFrom, true)}</p>
//       ) : collection.availableUntil ? (
//         <p>Available until {formatDate(collection.availableUntil, true)}</p>
//       ) : null}

//       <form onSubmit={(e) => e.preventDefault()} aria-label="Filter pieces">
//         <label>
//           <span>Min price (₦)</span>
//           <input type="number" min={0} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
//         </label>
//         <label>
//           <span>Max price (₦)</span>
//           <input type="number" min={0} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
//         </label>
//         <label>
//           <span>Sort by</span>
//           <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
//             <option value="release">Release</option>
//             <option value="price">Price</option>
//             <option value="date">Date added</option>
//           </select>
//         </label>
//         <label>
//           <span>Order</span>
//           <select value={order} onChange={(e) => setOrder(e.target.value as typeof order)}>
//             <option value="asc">Ascending</option>
//             <option value="desc">Descending</option>
//           </select>
//         </label>
//       </form>

//       {pieces.isLoading ? <Loading /> : null}
//       <ErrorMessage error={pieces.error} />
//       <ul>
//         {pieces.data?.map((p) => (
//           <li key={p.id}>
//             <ProductCard slug={p.slug} title={p.title} priceNgn={p.priceNgn} imageUrl={p.imageUrls[0]} status={p.status} />
//           </li>
//         ))}
//       </ul>
//     </article>
//   )
// }
