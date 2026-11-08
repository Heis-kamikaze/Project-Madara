// import { useState } from 'react'
// import { Link, useParams } from 'react-router-dom'
// import { useProduct } from '../api/products'
// import { useCart } from '../cart/useCart'
// import ErrorMessage from '../components/ui/ErrorMessage'
// import HelpLink from '../components/ui/HelpLink'
// import Loading from '../components/ui/Loading'
// import { usePageTitle } from '../hooks/usePageTitle'
// import { formatDate, formatNaira } from '../lib/format'

// export default function ProductPage() {
//   const { idOrSlug } = useParams()
//   const { data: product, isLoading, error } = useProduct(idOrSlug)
//   usePageTitle(product?.title ?? 'Piece')
//   const { add } = useCart()

//   const [imageIndex, setImageIndex] = useState(0)
//   const [size, setSize] = useState('')
//   const [notice, setNotice] = useState<string | null>(null)
//   const [added, setAdded] = useState(false)

//   if (isLoading) return <Loading />
//   if (error || !product) return <ErrorMessage error={error ?? new Error('Piece not found')} />

//   const needsSize = product.sizes.length > 0
//   const collection = product.collection
//   const image = product.imageUrls[imageIndex] ?? product.imageUrls[0]

//   function addToCart() {
//     if (!product) return
//     if (needsSize && !size) {
//       setNotice('Please choose a size first.')
//       return
//     }
//     setNotice(null)
//     add({
//       productId: product.id,
//       slug: product.slug,
//       title: product.title,
//       imageUrl: product.imageUrls[0] ?? null,
//       priceNgn: product.priceNgn,
//       size: needsSize ? size : null,
//     })
//     setAdded(true)
//   }

//   return (
//     <article>
//       {image ? <img src={image} alt={product.title} /> : null}
//       {product.imageUrls.length > 1 ? (
//         <ul aria-label="Photos">
//           {product.imageUrls.map((url, i) => (
//             <li key={url}>
//               <button type="button" aria-label={`Show photo ${i + 1}`} aria-current={i === imageIndex} onClick={() => setImageIndex(i)}>
//                 <img src={url} alt="" width={64} height={64} />
//               </button>
//             </li>
//           ))}
//         </ul>
//       ) : null}

//       <h1>{product.title}</h1>
//       <p>{formatNaira(product.priceNgn)}</p>
//       <p>
//         Colour: {product.colorName}
//         {product.colorHex ? <span aria-hidden="true" data-swatch={product.colorHex} /> : null}
//       </p>
//       {product.story ? <p>{product.story}</p> : null}
//       {collection ? (
//         <p>
//           From <Link to={`/collections/${collection.slug}`}>{collection.title}</Link>
//         </p>
//       ) : null}
//       {product.releaseAt ? <p>Released {formatDate(product.releaseAt)}</p> : null}

//       {product.orderable ? (
//         <div>
//           {needsSize ? (
//             <label>
//               <span>Size</span>
//               <select value={size} onChange={(e) => setSize(e.target.value)}>
//                 <option value="">Choose a size</option>
//                 {product.sizes.map((s) => (
//                   <option key={s} value={s}>
//                     {s}
//                   </option>
//                 ))}
//               </select>
//             </label>
//           ) : null}
//           <button type="button" onClick={addToCart}>
//             Add to cart
//           </button>
//           {notice ? <p role="alert">{notice}</p> : null}
//           {added ? (
//             <p role="status">
//               Added to your cart. <Link to="/cart">View cart</Link>
//             </p>
//           ) : null}
//           <p>
//             Pieces in a collection come exactly as shown. To change a colour or design, <Link to="/account/consultations/new">book a consultation</Link>.
//           </p>
//         </div>
//       ) : (
//         <aside role="note">
//           {collection?.status === 'archived' || product.status === 'archived' ? (
//             <>
//               <p>This piece belongs to an archived collection and can no longer be ordered.</p>
//               <HelpLink about={product.title} />
//             </>
//           ) : product.status === 'sold_out' || product.stock <= 0 ? (
//             <p>This piece is sold out.</p>
//           ) : collection?.availability === 'upcoming' ? (
//             <p>This piece is not open for orders yet.</p>
//           ) : (
//             <p>This piece is not available right now.</p>
//           )}
//         </aside>
//       )}
//     </article>
//   )
// }
