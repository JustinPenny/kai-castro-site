export type SectionKey = 'booking' | 'shows' | 'streams' | 'socials'

export interface CornerDef {
  key: SectionKey
  label: string
  glyph: string
}

// NOTE: placeholder content throughout -- swap in the real details.
// Flight offsets are measured live from the DOM (see Landing.tsx), not hardcoded here.
export const CORNERS: CornerDef[] = [
  { key: 'booking', label: 'Booking', glyph: '@' },
  { key: 'shows', label: 'Shows', glyph: '#' },
  { key: 'streams', label: 'Streams', glyph: '>' },
  { key: 'socials', label: 'Socials', glyph: '*' },
]

export const SECTION_CONTENT: Record<
  SectionKey,
  { title: string; body: string; links: { label: string; href: string }[] }
> = {
  booking: {
    title: 'Booking',
    body: 'For gigs, private events, and press inquiries, reach out below.',
    links: [
      { label: 'booking@kaicastro.com', href: 'mailto:booking@kaicastro.com' },
      { label: 'Press kit', href: '#' },
    ],
  },
  shows: {
    title: 'Shows',
    body: 'Placeholder dates -- swap in the real tour schedule.',
    links: [
      { label: 'Fri Mar 14 -- Warehouse, Brooklyn NY', href: '#' },
      { label: 'Sat Apr 05 -- The Lot, Austin TX', href: '#' },
      { label: 'Fri May 02 -- Sunset Terrace, LA', href: '#' },
    ],
  },
  streams: {
    title: 'Streams',
    body: 'Listen to the latest sets and releases.',
    links: [
      { label: 'SoundCloud', href: '#' },
      { label: 'Spotify', href: '#' },
      { label: 'Apple Music', href: '#' },
      { label: 'YouTube', href: '#' },
    ],
  },
  socials: {
    title: 'Socials',
    body: 'Follow along.',
    links: [
      { label: 'Instagram @kaicastro', href: '#' },
      { label: 'TikTok @kaicastro', href: '#' },
      { label: 'X @kaicastro', href: '#' },
    ],
  },
}
