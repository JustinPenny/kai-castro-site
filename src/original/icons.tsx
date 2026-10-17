// Simple stroke-based corner icons (24x24, currentColor, feather/lucide-style
// proportions) standing in for the old @ # > * text glyphs.
//
// A real icon package (lucide-react is the standard modern choice: 1500+
// tree-shakable icons, ISC licensed) would be the normal way to do this, but
// this sandbox's npm registry access is blocked (`npm install` returns a 403),
// so these are hand-built inline instead -- same visual language, no
// dependency required. Swap in lucide-react's CalendarDays/Disc3/Headphones/
// Share2 later if you'd rather pull from the library once you can install it.
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base: IconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

// Booking -- calendar
export function BookingIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  )
}

// Shows -- turntable (vinyl record + tonearm)
export function ShowsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="14" r="7" />
      <circle cx="10" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="4" r="1.5" />
      <line x1="17.7" y1="5.7" x2="13.5" y2="10.5" />
    </svg>
  )
}

// Streams -- headphones
export function StreamsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <rect x="1" y="15" width="6" height="7" rx="2" />
      <rect x="17" y="15" width="6" height="7" rx="2" />
    </svg>
  )
}

// Socials -- share
export function SocialsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
    </svg>
  )
}
