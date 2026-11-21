import feedIcon from './assets/food_icon.webp'
import pottyIcon from './assets/potty_icon.webp'
import sleepIcon from './assets/sleep_icon.webp'
import playIcon from './assets/play_icon.webp'

// Site copy and links. Booking email is NOT here on purpose: the Worker hands
// it out only after a Turnstile check (see worker/index.ts).

export type SectionKey = 'booking' | 'shows' | 'streams' | 'socials'

export const SECTIONS: Record<SectionKey, { title: string; body: string; links: { label: string; href: string }[] }> = {
  booking: {
    title: 'Booking',
    body: 'Gigs, private events and press.',
    links: [{ label: 'Press kit', href: '#' }], // placeholder: real press-kit URL
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
export const MENU: { item: MenuItem; label: string; icon?: string }[] = [
  { item: 'feed', label: 'Feed', icon: feedIcon },
  { item: 'potty', label: 'Bathroom', icon: pottyIcon },
  { item: 'sleep', label: 'Sleep', icon: sleepIcon },
  { item: 'play', label: 'Play', icon: playIcon },
  { item: 'stats', label: 'Status' },
]

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
