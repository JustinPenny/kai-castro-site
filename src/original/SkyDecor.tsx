import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { CLOUD_VARIANTS } from './cloudVariants'
import { useClock } from './useClock'
import { celestialPositionAt, CLOCK_INTERVAL_MS } from './timeOfDay'
import sun1 from './assets/sun_1.webp'
import sun2 from './assets/sun_2.webp'
import sun3 from './assets/sun_3.webp'
import sun4 from './assets/sun_4.webp'
import moonSrc from './assets/moon.webp'
import stars1 from './assets/stars_1.webp'
import stars2 from './assets/stars_2.webp'
import stars3 from './assets/stars_3.webp'
import stars4 from './assets/stars_4.webp'
import stars5 from './assets/stars_5.webp'
import stars6 from './assets/stars_6.webp'
import stars7 from './assets/stars_7.webp'

const SUN_SIZE = 72
const SUN_SRC = [sun1, sun2, sun3, sun4]
const FRAME_TICK_MS = 800 // cadence for the sun's idle sprite-wiggle animation

const MOON_SIZE = 72
const MOON_SRC = moonSrc

// Each of these is already a small cluster of a few pixel stars, not a
// single star -- so only a handful of instances are needed per screen-width
// of sky.
const STAR_SRC = [stars1, stars2, stars3, stars4, stars5, stars6, stars7]
const STAR_SIZE = 48

const CLOUD_CELL = 5
const CLOUD_FILL_COLOR = 'rgba(255, 255, 255, 0.92)'

// Fallback horizontal padding for the sun/moon path, used until real
// measurements are available (and as an outer bound even after that).
const EDGE_PADDING_PCT = 4

// Anything the sun/moon should stay clear of -- the corner nodes and the
// center "stump" scene. Measured live via getBoundingClientRect so the sun's
// safe travel zone adapts to actual layout/viewport instead of guessed
// percentages.
const AVOID_SELECTORS = ['.corner-booking', '.corner-shows', '.wordmark-wrap', '.stump-anchor']
const SAFE_ZONE_BUFFER_PX = 20

// Deterministic pseudo-random in [0, 1) -- same sine-hash technique as
// GrassStrip's tick heights, so the scatter looks random but is stable
// across renders instead of reshuffling on every re-render.
function rand(seed: number): number {
  const s = Math.sin(seed * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

function boxShadow(cells: number[], cell: number, color: string): string {
  const shadows: string[] = []
  for (let i = 0; i < cells.length; i += 2) {
    const row = cells[i]
    const col = cells[i + 1]
    shadows.push(`${col * cell}px ${row * cell}px 0 0 ${color}`)
  }
  return shadows.join(',')
}

// Sky strip's own height in px -- kept in sync with `.sky-strip { height }`
// in Landing.css. Vertical placement uses this so an item's top offset
// always leaves room for its full height, and its bottom edge never lands
// past the strip (which would get clipped by `overflow: hidden`).
const SKY_STRIP_HEIGHT_PX = 100
const VERTICAL_MARGIN_PX = 4

// Picks a top offset (as % of the strip's height) that always leaves the
// full itemHeightPx inside the strip -- never too low (bottom clipped) or,
// in principle, too high (top clipped).
function safeTopPct(itemHeightPx: number, seed: number): number {
  const usable = SKY_STRIP_HEIGHT_PX - itemHeightPx - VERTICAL_MARGIN_PX * 2
  if (usable <= 0) {
    // Item is taller than the strip has safe room for -- just center it.
    return ((SKY_STRIP_HEIGHT_PX - itemHeightPx) / 2 / SKY_STRIP_HEIGHT_PX) * 100
  }
  const topPx = VERTICAL_MARGIN_PX + rand(seed) * usable
  return (topPx / SKY_STRIP_HEIGHT_PX) * 100
}

// ---- Clouds / stars: a fixed, indefinitely-wide backdrop -----------------
// These are generated once as absolute pixel positions across a field much
// wider than any real screen, evenly spaced with a little jitter so they
// read as "randomly placed" without ever bunching up or overlapping. They
// never move or regenerate: widening the window just reveals more of the
// field that was already there, narrowing it clips some off (the strip's
// `overflow: hidden` handles that), instead of squishing/rescaling to fit
// -- and it means there's no "blank" gap after expanding the window, since
// the field was never limited to the size of the initial viewport.
const FIELD_WIDTH_PX = 6000
const FIELD_EDGE_MARGIN_PX = 320 // static clearance from the corner buttons on typical screens

function evenlySpacedLefts(gapPx: number, jitterPx: number, seedOffset: number): number[] {
  const usable = FIELD_WIDTH_PX - FIELD_EDGE_MARGIN_PX * 2
  const count = Math.max(1, Math.ceil(usable / gapPx))
  return Array.from({ length: count }, (_, i) => {
    const base = FIELD_EDGE_MARGIN_PX + i * gapPx
    const jitter = (rand(seedOffset + i) - 0.5) * 2 * jitterPx
    return base + jitter
  })
}

// Daytime: clouds evenly spaced across the fixed field.
const CLOUD_GAP_PX = 208 // 260 / 1.25 -> 25% more clouds per unit width
const CLOUD_JITTER_PX = 50
const CLOUDS = evenlySpacedLefts(CLOUD_GAP_PX, CLOUD_JITTER_PX, 0).map((leftPx, i) => {
  const variant = CLOUD_VARIANTS[i % CLOUD_VARIANTS.length]
  return {
    variant,
    leftPx,
    topPct: safeTopPct(variant.h * CLOUD_CELL, i * 2 + 2),
  }
})

// Nighttime: star clusters evenly spaced the same way (different seed offset
// so the layout doesn't mirror the cloud one).
const STAR_GAP_PX = 176 // 220 / 1.25 -> 25% more star clusters per unit width
const STAR_JITTER_PX = 40
const STAR_CLUSTERS = evenlySpacedLefts(STAR_GAP_PX, STAR_JITTER_PX, 500).map((leftPx, i) => ({
  src: STAR_SRC[i % STAR_SRC.length],
  leftPx,
  topPct: safeTopPct(STAR_SIZE, 500 + i * 2 + 2),
}))

interface SafeZone {
  minPct: number
  maxPct: number
}

// Sun/moon travel needs to track the viewport live (it's an animated body
// sweeping across whatever width the screen currently is), so its safe zone
// keeps re-measuring on resize.
function useSafeZone(containerRef: RefObject<HTMLDivElement | null>): SafeZone {
  const [zone, setZone] = useState<SafeZone>({ minPct: EDGE_PADDING_PCT, maxPct: 100 - EDGE_PADDING_PCT })

  useEffect(() => {
    function measure() {
      const container = containerRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()
      if (containerRect.width === 0) return

      let minPct = EDGE_PADDING_PCT
      let maxPct = 100 - EDGE_PADDING_PCT

      for (const selector of AVOID_SELECTORS) {
        const el = document.querySelector<HTMLElement>(selector)
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.bottom < containerRect.top || r.top > containerRect.bottom) continue

        const elCenter = r.left + r.width / 2
        const containerCenter = containerRect.left + containerRect.width / 2
        if (elCenter < containerCenter) {
          const edgePct = ((r.right - containerRect.left + SAFE_ZONE_BUFFER_PX) / containerRect.width) * 100
          minPct = Math.max(minPct, edgePct)
        } else {
          const edgePct = ((r.left - containerRect.left - SAFE_ZONE_BUFFER_PX) / containerRect.width) * 100
          maxPct = Math.min(maxPct, edgePct)
        }
      }

      if (minPct < maxPct) setZone({ minPct, maxPct })
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [containerRef])

  return zone
}

export default function SkyDecor() {
  const stripRef = useRef<HTMLDivElement>(null)
  const [frameTick, setFrameTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setFrameTick((t) => t + 1), FRAME_TICK_MS)
    return () => clearInterval(id)
  }, [])

  const { minPct, maxPct } = useSafeZone(stripRef)

  // Real time of day drives where the sun/moon sits on its right-to-left
  // path -- sun 6am (right) -> 8pm (left), moon takes over the rest of the
  // cycle following the same right-to-left sweep, confined to the safe zone.
  const now = useClock(CLOCK_INTERVAL_MS)
  const { body, progress } = celestialPositionAt(now)
  const leftPct = maxPct - progress * (maxPct - minPct)

  const sunFrame = frameTick % SUN_SRC.length

  return (
    <div className="sky-strip" ref={stripRef} aria-hidden="true">
      <img
        className={body === 'sun' ? 'sky-body' : 'sky-body sky-body-moon'}
        src={body === 'sun' ? SUN_SRC[sunFrame] : MOON_SRC}
        width={body === 'sun' ? SUN_SIZE : MOON_SIZE}
        height={body === 'sun' ? SUN_SIZE : MOON_SIZE}
        style={{ left: `${leftPct}%` }}
        alt=""
      />

      {body === 'sun' ? (
        <div className="cloud-scatter">
          {CLOUDS.map(({ variant, leftPx, topPct: ct }, i) => (
            <div
              key={i}
              className="cloud-tile"
              style={{ left: `${leftPx}px`, top: `${ct}%`, width: variant.w * CLOUD_CELL, height: variant.h * CLOUD_CELL }}
            >
              <div
                className="cloud-pixel"
                style={{ width: CLOUD_CELL, height: CLOUD_CELL, boxShadow: boxShadow(variant.fill, CLOUD_CELL, CLOUD_FILL_COLOR) }}
              />
              <div
                className="cloud-pixel"
                style={{ width: CLOUD_CELL, height: CLOUD_CELL, boxShadow: boxShadow(variant.outline, CLOUD_CELL, 'var(--ink)') }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="star-scatter">
          {STAR_CLUSTERS.map(({ src, leftPx, topPct: st }, i) => (
            <img
              key={i}
              className="star-cluster"
              src={src}
              width={STAR_SIZE}
              height={STAR_SIZE}
              style={{ left: `${leftPx}px`, top: `${st}%` }}
              alt=""
            />
          ))}
        </div>
      )}
    </div>
  )
}
