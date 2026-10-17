// ---- TEMPORARY, FOR TESTING -------------------------------------------
// Compresses the sun/moon cycle to 1 minute each (instead of the real
// 6am-8pm day / rest-of-day night split) so the movement can be watched
// end-to-end quickly. Set back to `false` to restore real time-of-day
// behavior.
const TEST_MODE = true
const TEST_PASS_MS = 60_000 // how long each body takes to cross the sky in test mode
// -------------------------------------------------------------------------

// Sun is up 6:00am -> 8:00pm, moon covers the rest of the 24h cycle.
export const SUNRISE_MIN = 6 * 60 // 6:00am
export const SUNSET_MIN = 20 * 60 // 8:00pm
const DAY_LEN = SUNSET_MIN - SUNRISE_MIN
const NIGHT_LEN = 24 * 60 - DAY_LEN

// How often callers should refresh the clock. Fast in test mode so the
// compressed 1-minute cycle still reads as smooth, gradual movement.
export const CLOCK_INTERVAL_MS = TEST_MODE ? 1_000 : 30_000

export interface CelestialPosition {
  body: 'sun' | 'moon'
  // 0 = just risen (right edge of the sky), 1 = about to set (left edge).
  progress: number
}

export function celestialPositionAt(date: Date): CelestialPosition {
  if (TEST_MODE) {
    const elapsed = date.getTime() % (TEST_PASS_MS * 2)
    return elapsed < TEST_PASS_MS
      ? { body: 'sun', progress: elapsed / TEST_PASS_MS }
      : { body: 'moon', progress: (elapsed - TEST_PASS_MS) / TEST_PASS_MS }
  }

  const minutes = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60

  if (minutes >= SUNRISE_MIN && minutes < SUNSET_MIN) {
    return { body: 'sun', progress: (minutes - SUNRISE_MIN) / DAY_LEN }
  }

  const sinceSunset = minutes >= SUNSET_MIN ? minutes - SUNSET_MIN : minutes + (24 * 60 - SUNSET_MIN)
  return { body: 'moon', progress: sinceSunset / NIGHT_LEN }
}
