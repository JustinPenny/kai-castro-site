// Bandsintown "Artist events" public API -- see
// https://help.artists.bandsintown.com/en/articles/9186477-api-documentation
//
// Requires an app_id. Get a real one from the Bandsintown for Artists
// dashboard (Settings -> General -> API Key, tied to Kai's artist account)
// and set it as VITE_BANDSINTOWN_APP_ID in a local .env file (see
// .env.example) -- that's a login-gated step only the account owner can do,
// so it isn't hardcoded here. Until a real key is set, requests fall back to
// a placeholder app_id that the API may reject; useBandsintownShows.ts
// handles that failure by falling back to a link straight to the
// Bandsintown page instead of breaking the Shows panel.
const ARTIST_ID = '12427370'
const APP_ID = import.meta.env.VITE_BANDSINTOWN_APP_ID || 'kaicastro-website'

export const BANDSINTOWN_ARTIST_URL = 'https://www.bandsintown.com/a/12427370-kai-castro'

export interface BandsintownShow {
  id: string
  datetime: string
  venueName: string
  location: string
  url: string
}

interface RawBandsintownEvent {
  id: string
  datetime: string
  url: string
  venue: {
    name: string
    city: string
    region: string
    country: string
  }
}

export async function fetchUpcomingShows(): Promise<BandsintownShow[]> {
  const endpoint = `https://rest.bandsintown.com/artists/id_${ARTIST_ID}/events/?app_id=${encodeURIComponent(APP_ID)}&date=upcoming`
  const res = await fetch(endpoint)
  if (!res.ok) {
    throw new Error(`Bandsintown API responded ${res.status}`)
  }
  const data: RawBandsintownEvent[] = await res.json()
  return data.map((e) => ({
    id: e.id,
    datetime: e.datetime,
    venueName: e.venue.name,
    location: e.venue.region ? `${e.venue.city}, ${e.venue.region}` : `${e.venue.city}, ${e.venue.country}`,
    url: e.url,
  }))
}

// Matches the placeholder copy's style: "Fri Mar 14 -- Warehouse, Brooklyn NY".
export function formatShowLabel(show: BandsintownShow): string {
  const d = new Date(show.datetime)
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const day = String(d.getDate()).padStart(2, '0')
  return `${weekday} ${month} ${day} -- ${show.venueName}, ${show.location}`
}
