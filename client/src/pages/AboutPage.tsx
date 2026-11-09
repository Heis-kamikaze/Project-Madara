import { usePageTitle } from '../hooks/usePageTitle'

/**
 * Static page. The copy is the draft from the design file; replace it with the final brand
 * story, vision, mission and values (or move it into the CMS later).
 */
export default function AboutPage() {
  usePageTitle('About')
  return (
    <article className="pt-2 lg:mx-auto lg:max-w-2xl lg:pt-8">
      <p className="eyebrow">About us</p>
      <h1 data-anim="reveal" className="mt-2 font-serif text-[22px] lg:text-[40px]">
        Brand Story
      </h1>
      <p className="mt-3 text-[12px] leading-[1.7] text-ink-soft lg:text-[15px]">
        Aradam began as hand-crocheted pieces made in Lagos, worn first by friends — craft that became a house.
      </p>

      <h2 data-anim="reveal" className="mt-8 font-serif text-[20px] lg:text-[28px]">
        Core Values
      </h2>
      <ul className="mt-2 text-[12px] leading-[2] text-ink-soft lg:text-[15px]">
        <li>• Craftsmanship over speed</li>
        <li>• Made-to-order, never mass-produced</li>
        <li>• Transparency with every client</li>
      </ul>
    </article>
  )
}
