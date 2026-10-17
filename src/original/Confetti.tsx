import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

const PIECE_COUNT = 36
const COLORS = ['#ff5c8a', '#ffd23f', '#3fd6ff', '#7cff6b', '#b98bff']
// Longest possible piece lifetime (delay + duration, see below) plus a hair
// of margin, so pieces are cleared once every last one has finished falling.
const FIELD_LIFETIME_MS = 3000

interface ConfettiPiece {
  id: number
  leftPct: number
  delay: number
  duration: number
  color: string
  startRotate: number
}

interface ConfettiProps {
  // Bump this (e.g. a counter) each time a burst should fire. 0 means "no
  // burst yet" so nothing renders on first mount.
  burstId: number
}

export default function Confetti({ burstId }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (burstId === 0) return
    setPieces(
      Array.from({ length: PIECE_COUNT }, (_, i) => ({
        id: i,
        leftPct: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.6 + Math.random() * 0.8,
        color: COLORS[i % COLORS.length],
        startRotate: Math.random() * 360,
      })),
    )
    const clear = setTimeout(() => setPieces([]), FIELD_LIFETIME_MS)
    return () => clearTimeout(clear)
  }, [burstId])

  if (pieces.length === 0) return null

  return (
    <div className="confetti-field" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={
            {
              left: `${p.leftPct}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              background: p.color,
              '--start-rotate': `${p.startRotate}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
