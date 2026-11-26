// Site copy and links.

export type SectionKey = 'booking' | 'shows' | 'streams' | 'socials'

export const SECTIONS: Record<SectionKey, { title: string; body: string; links: { label: string; href: string }[] }> = {
  booking: {
    title: 'Booking',
    body: 'Gigs, private events and press.',
    links: [
      { label: 'kai@kaicastro.com', href: 'mailto:kai@kaicastro.com' },
      { label: 'Press kit', href: 'https://drive.google.com/file/d/1vwyxz2aGtVpxjflLHIOA71oqDr1E0Ke0/view' },
    ],
  },
  shows: { title: 'Shows', body: '', links: [] }, // filled from Bandsintown
  streams: {
    title: 'Streams',
    body: 'Latest sets and releases.',
    links: [
      { label: 'SoundCloud', href: 'https://soundcloud.com/KaiCastroMusic' },
      { label: 'Spotify', href: 'https://open.spotify.com/artist/2cYtaNdvkOUrivC6EVRAxL' },
      { label: 'Beatport', href: 'https://www.beatport.com/artist/kai-castro/650453?a_aid=6871a9eb0c75a' },
      { label: 'YouTube', href: 'https://www.youtube.com/@kaicastromusic/videos' },
    ],
  },
  socials: {
    title: 'Socials',
    body: 'Follow along.',
    links: [
      { label: 'Instagram', href: 'https://www.instagram.com/kaicastromusic/' },
      { label: 'TikTok', href: 'https://www.tiktok.com/@kaicastromusic' },
    ],
  },
}

export type Action = 'feed' | 'potty' | 'sleep' | 'play'
export type MenuItem = Action | 'stats'

export type StatKey = 'hunger' | 'fullness' | 'energy' | 'boredom'
export type Stats = Record<StatKey, number>

export const STAT_LABELS: Record<StatKey, string> = {
  hunger: 'Hunger',
  fullness: 'Fullness',
  energy: 'Energy',
  boredom: 'Boredom',
}
export const ACTION_STAT: Record<Action, StatKey> = { feed: 'hunger', potty: 'fullness', sleep: 'energy', play: 'boredom' }
export const STAT_DROP = 25

const rand = () => Math.floor(Math.random() * 101)
export const randomStats = (): Stats => ({ hunger: rand(), fullness: rand(), energy: rand(), boredom: rand() })
