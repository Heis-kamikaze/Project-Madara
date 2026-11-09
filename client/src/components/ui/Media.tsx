import { swatchFor } from '../../lib/swatch'

interface Props {
  src?: string | null
  /** Any stable string; picks the placeholder gradient when there is no photo. */
  seed: string
  alt?: string
  className?: string
}

/** A photo that fills its box, or a house-colour gradient until a photo is uploaded. Give it a size via className. */
export default function Media({ src, seed, alt = '', className = '' }: Props) {
  return (
    <div className={`swatch ${src ? 'bg-bg-alt' : swatchFor(seed)} ${className}`}>
      {src ? <img src={src} alt={alt} loading="lazy" className="absolute inset-0 size-full object-cover" /> : null}
    </div>
  )
}
