import { useEffect, useState } from 'react'

// PLACEHOLDER ART: every pose renders the same pixel blob plus its pose name.
// To add real frames, map pose name -> image here; Screen.tsx already drives
// the full sequences (idle bob/blink/caw, flap, eat, potty, sleep, play).
const BLOB = [
  '....####....',
  '..########..',
  '.##########.',
  '.###o##o###.',
  '############',
  '#####mm#####',
  '############',
  '.##########.',
  '.##########.',
  '..##....##..',
]
const EYES_SHUT = /blink|sleep/

const BOB_MS = 650
const FLAP_MS = 140
const BLINK_EVERY = 4
const CAW_EVERY = 10

export default function Buddy({
  pose,
  flying,
  x,
  y,
  facingLeft,
  durationMs,
}: {
  pose: string | null // an action pose, or null for idle/flap
  flying: boolean
  x: number
  y: number
  facingLeft: boolean
  durationMs: number
}) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), flying ? FLAP_MS : BOB_MS)
    return () => clearInterval(id)
  }, [flying])

  const bob = Math.floor(tick / 2) + 1
  const shown =
    pose ??
    (flying
      ? tick % 2 ? 'idle' : 'flap'
      : tick % 2 ? 'idle down' : bob % CAW_EVERY === 0 ? 'caw' : bob % BLINK_EVERY === 0 ? 'blink' : 'idle')

  return (
    <div
      className="buddy"
      data-pose={shown}
      aria-hidden="true"
      style={{
        translate: `calc(-50% + ${x}px) calc(-50% + ${y}px)`,
        transition: `translate ${durationMs}ms steps(8, end)`,
      }}
    >
      <svg viewBox="0 0 12 10" shapeRendering="crispEdges" style={{ scale: facingLeft ? '-1 1' : '1 1' }}>
        {BLOB.flatMap((row, r) =>
          [...row].map((c, col) =>
            c === '#' || (c === 'o' && EYES_SHUT.test(shown)) || (c === 'm' && shown !== 'caw' && !shown.startsWith('eat')) ? (
              <rect key={`${r}-${col}`} x={col} y={r} width="1" height="1" />
            ) : null,
          ),
        )}
      </svg>
      <span className="buddy-pose">{shown}</span>
    </div>
  )
}
