// import { useMuseum } from '../api/museum'
// import ErrorMessage from '../components/ui/ErrorMessage'
// import Loading from '../components/ui/Loading'
// import { usePageTitle } from '../hooks/usePageTitle'

// /** Curated gallery of custom pieces. */
// export default function MuseumPage() {
//   usePageTitle('Museum')
//   const { data, isLoading, error } = useMuseum()
//   return (
//     <section>
//       <h1>Museum</h1>
//       {isLoading ? <Loading /> : null}
//       <ErrorMessage error={error} />
//       {data && data.length === 0 ? <p>The museum is being curated. Check back soon.</p> : null}
//       <ul>
//         {data?.map((entry) => (
//           <li key={entry.id}>
//             <article>
//               <h2>{entry.title}</h2>
//               <div>
//                 {entry.imageUrls.map((url) => (
//                   <img key={url} src={url} alt={entry.title} loading="lazy" />
//                 ))}
//               </div>
//               {entry.story ? <p>{entry.story}</p> : null}
//             </article>
//           </li>
//         ))}
//       </ul>
//     </section>
//   )
// }
