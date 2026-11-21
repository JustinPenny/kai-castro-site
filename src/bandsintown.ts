import { useEffect, useState } from 'react'

// Bandsintown public artist-events API. The app_id is public by design (it
// ships in the browser), so it lives in VITE_BANDSINTOWN_APP_ID, not a secret.
const ARTIST_ID = '12427370'
const APP_ID = import.meta.env.VITE_BANDSINTOWN_APP_ID || 'kaicastro-website'
export const BANDSINTOWN_URL = 'https://www.bandsintown.com/a/12427370-kai-castro'

export interface Show {
  id: string
  url: string
  label: string
}

interface RawEvent {
  id: string
  datetime: string
  url: string
  venue: { name: string; city: string; region: string; country: string }
}

async function fetchShows(): Promise<Show[]> {
  const res = await fetch(
    `https://rest.bandsintown.com/artists/id_${ARTIST_ID}/events/?app_id=${encodeURIComponent(APP_ID)}&date=upcoming`,
  )
  if (!res.ok) throw new Error(`Bandsintown ${res.status}`)
  const events: RawEvent[] = await res.json()
  return events.map((e) => {
    const d = new Date(e.datetime)
    const date = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' })
    const where = e.venue.region ? `${e.venue.city}, ${e.venue.region}` : `${e.venue.city}, ${e.venue.country}`
    return { id: e.id, url: e.url, label: `${date} -- ${e.venue.name}, ${where}` }
  })
}

export function useShows() {
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; shows: Show[] }>({
    status: 'loading',
    shows: [],
  })
  useEffect(() => {
    let cancelled = false
    fetchShows().then(
      (shows) => !cancelled && setState({ status: 'ready', shows }),
      () => !cancelled && setState({ status: 'error', shows: [] }),
    )
    return () => {
      cancelled = true
    }
  }, [])
  return state
}
