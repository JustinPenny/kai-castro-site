import { useEffect, useState } from 'react'
import { fetchUpcomingShows, type BandsintownShow } from './bandsintown'

type ShowsStatus = 'loading' | 'ready' | 'error'

// Fetched once on mount (regardless of whether the Shows panel is open yet)
// so the dates are already there by the time the bird lands on that corner.
export function useBandsintownShows() {
  const [shows, setShows] = useState<BandsintownShow[]>([])
  const [status, setStatus] = useState<ShowsStatus>('loading')

  useEffect(() => {
    let cancelled = false
    fetchUpcomingShows()
      .then((data) => {
        if (cancelled) return
        setShows(data)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { shows, status }
}
