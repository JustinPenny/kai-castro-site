import { useEffect, useRef, useState } from 'react'
import birdIdle from './assets/bird_idle.webp'
import birdUp from './assets/bird_up.webp'
import birdDown from './assets/bird_down.webp'

// Same on-screen footprint as the old pixel-grid sprite (72px wide).
const SIZE = 72

const SRC = {
  perched: birdIdle,
  fly_up: birdUp,
  fly_down: birdDown,
} as const

interface BirdProps {
  flying: boolean
  offsetX: number
  offsetY: number
  durationMs: number
  // 1 = normal size, 1.5 = 50% bigger (from eating worms). Animates via the
  // width/height transition below instead of `scale`, since `scale` is
  // reserved for the instant left/right flip.
  growthScale?: number
  // Brief white flicker at the top of the worm-eating celebration.
  flashing?: boolean
}

export default function Bird({
  flying,
  offsetX,
  offsetY,
  durationMs,
  growthScale = 1,
  flashing = false,
}: BirdProps) {
  const [flapFrame, setFlapFrame] = useState<'fly_up' | 'fly_down'>('fly_up')
  const [facingLeft, setFacingLeft] = useState(false)
  const prevOffsetX = useRef(offsetX)

  useEffect(() => {
    if (!flying) return
    const id = setInterval(() => {
      setFlapFrame((f) => (f === 'fly_up' ? 'fly_down' : 'fly_up'))
    }, 120)
    return () => clearInterval(id)
  }, [flying])

  // Face the direction of travel: a new target to the left of where the
  // bird currently is means it's flying left, so mirror the (right-facing) art.
  useEffect(() => {
    const dx = offsetX - prevOffsetX.current
    if (dx < -2) setFacingLeft(true)
    else if (dx > 2) setFacingLeft(false)
    prevOffsetX.current = offsetX
  }, [offsetX])

  const frameKey = flying ? flapFrame : 'perched'
  const size = SIZE * growthScale

  return (
    <img
      className={flashing ? 'bird bird-flash' : 'bird'}
      src={SRC[frameKey]}
      width={SIZE}
      height={SIZE}
      style={{
        // `translate` animates the flight; `scale` is a separate CSS property
        // with no transition, so the left/right mirror snaps instantly. Size
        // (width/height) is a third independent axis so growing/shrinking
        // from eating worms can transition smoothly without touching either
        // of those. `translate`'s -50%/-50% resolves against this element's
        // own (possibly grown) box, so it stays centered on its anchor point
        // as it grows.
        width: size,
        height: size,
        translate: `calc(-50% + ${offsetX}px) calc(-50% + ${offsetY}px)`,
        scale: facingLeft ? '-1 1' : '1 1',
        transition: `translate ${durationMs}ms cubic-bezier(0.45, 0, 0.55, 1), width 250ms ease-out, height 250ms ease-out`,
      }}
      alt=""
      aria-hidden="true"
    />
  )
}
