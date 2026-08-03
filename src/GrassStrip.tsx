const TICK_COUNT = 90
const MIN_HEIGHT = 6
const MAX_HEIGHT = 22

// Deterministic pseudo-random height per tick (cheap sine-hash), so the
// variation looks natural but doesn't change between renders.
function tickHeight(i: number): number {
  const seed = Math.sin(i * 12.9898) * 43758.5453
  const frac = seed - Math.floor(seed)
  return MIN_HEIGHT + Math.round(frac * (MAX_HEIGHT - MIN_HEIGHT))
}

const HEIGHTS = Array.from({ length: TICK_COUNT }, (_, i) => tickHeight(i))

export default function GrassStrip() {
  return (
    <div className="grass-strip" aria-hidden="true">
      {HEIGHTS.map((h, i) => (
        <span key={i} className="grass-tick" style={{ height: h }} />
      ))}
    </div>
  )
}
