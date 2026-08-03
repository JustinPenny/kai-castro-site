import { useEffect, useState } from 'react'
import { SKY_FRAMES, SKY_W, SKY_H } from './skyFrames'
import { CLOUD_VARIANTS } from './cloudVariants'

const SUN_CELL = 4
const CLOUD_CELL = 5
const TICK_MS = 800 // shared clock for the sun twinkle and the cloud step, same cadence throughout
const STEP_PX = 6 // how far the cloud track steps left each tick (no easing, so it stays pixel-crisp)
const CLOUD_FILL_COLOR = 'rgba(255, 255, 255, 0.92)' // white interior, opaque enough to hide the sun

// Gap (px) that follows each variant in the repeating sequence -- varying these
// (instead of one fixed gap) is what gives the spacing some rhythm/variety.
const GAPS_AFTER = [70, 100, 55]
const PATTERN = CLOUD_VARIANTS.map((variant, i) => ({
  variant,
  gapAfter: GAPS_AFTER[i % GAPS_AFTER.length],
}))
const PATTERN_WIDTH = PATTERN.reduce((sum, p) => sum + p.variant.w * CLOUD_CELL + p.gapAfter, 0)
const REPEATS = 7 // long enough to cover very wide viewports with a full pattern to spare

interface Tile {
  left: number
  variant: (typeof CLOUD_VARIANTS)[number]
}

const TILES: Tile[] = []
for (let rep = 0; rep < REPEATS; rep++) {
  let cursor = rep * PATTERN_WIDTH
  for (const p of PATTERN) {
    TILES.push({ left: cursor, variant: p.variant })
    cursor += p.variant.w * CLOUD_CELL + p.gapAfter
  }
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

function sunBoxShadow(frameIndex: number): string {
  return boxShadow(SKY_FRAMES[frameIndex], SUN_CELL, 'var(--ink)')
}

export default function SkyDecor() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS)
    return () => clearInterval(id)
  }, [])

  const sunFrame = tick % SKY_FRAMES.length
  // Negative, wrapped to one pattern-width -- steps left each tick, no transition,
  // so once it wraps the next identical pattern is already in place (seamless loop).
  const cloudOffset = -((tick * STEP_PX) % PATTERN_WIDTH)

  return (
    <div className="sky-strip" aria-hidden="true">
      <div className="sky-sun" style={{ width: SKY_W * SUN_CELL, height: SKY_H * SUN_CELL }}>
        <div className="sky-decor-pixel" style={{ width: SUN_CELL, height: SUN_CELL, boxShadow: sunBoxShadow(sunFrame) }} />
      </div>

      <div
        className="cloud-track"
        style={{
          width: REPEATS * PATTERN_WIDTH,
          transform: `translateY(-50%) translateX(${cloudOffset}px)`,
        }}
      >
        {TILES.map(({ left, variant }, i) => (
          <div key={i} className="cloud-tile" style={{ left, width: variant.w * CLOUD_CELL, height: variant.h * CLOUD_CELL }}>
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
    </div>
  )
}
