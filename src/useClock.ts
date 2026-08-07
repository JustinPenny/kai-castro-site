import { useEffect, useState } from 'react'

/**
 * Shared "what time is it" primitive. Returns the current time, refreshed on
 * the given interval, for anything that needs to react to time of day (e.g.
 * the sun/moon position in SkyDecor).
 */
export function useClock(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
