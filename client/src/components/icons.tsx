import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-[15px]"
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconMenu = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </Base>
)
export const IconSearch = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Base>
)
export const IconBack = (p: IconProps) => (
  <Base {...p}>
    <path d="M15 18l-6-6 6-6" />
  </Base>
)
export const IconClose = (p: IconProps) => (
  <Base {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </Base>
)
export const IconBag = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 8h14l-1 12H6L5 8z" />
    <path d="M9 8V6a3 3 0 016 0v2" />
  </Base>
)
export const IconMail = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="6" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </Base>
)
export const IconUser = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
  </Base>
)
export const IconBox = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 7l2-4h14l2 4M3 7v13h18V7M3 7h18" />
  </Base>
)
export const IconArrow = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
)
export const IconSend = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12l14-7-5 14-2-6-7-1z" />
  </Base>
)
