import { useMemo } from 'react'
import type { CSSProperties } from 'react'

const PARTICLE_COUNT = 12

interface BirdBurstProps {
  offsetX: number
  offsetY: number
}

// A short-lived puff of pixels standing in for the bird "exploding" at the
// top of the worm-eating celebration -- mounted only while Landing's
// `birdExploding` is true, in place of the normal <Bird>.
export default function BirdBurst({ offsetX, offsetY }: BirdBurstProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.5
        const dist = 36 + Math.random() * 32
        return {
          id: i,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
        }
      }),
    [],
  )

  return (
    <div
      className="bird-burst"
      style={{ translate: `calc(-50% + ${offsetX}px) calc(-50% + ${offsetY}px)` }}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="bird-burst-piece"
          style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px` } as CSSProperties}
        />
      ))}
    </div>
  )
}
