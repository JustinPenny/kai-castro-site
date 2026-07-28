import { useEffect, useState } from 'react'
import { BIRD_FRAMES, BIRD_W, BIRD_H } from './birdFrames'

const CELL = 4

function boxShadowFor(frameKey: string): string {
  const cells = BIRD_FRAMES[frameKey]
  const shadows: string[] = []
  for (let i = 0; i < cells.length; i += 2) {
    const row = cells[i]
    const col = cells[i + 1]
    shadows.push(`${col * CELL}px ${row * CELL}px 0 0 var(--ink)`)
  }
  return shadows.join(',')
}

interface BirdProps {
  flying: boolean
  offsetX: string
  offsetY: string
  durationMs: number
}

export default function Bird({ flying, offsetX, offsetY, durationMs }: BirdProps) {
  const [flapFrame, setFlapFrame] = useState<'fly_up' | 'fly_down'>('fly_up')

  useEffect(() => {
    if (!flying) return
    const id = setInterval(() => {
      setFlapFrame((f) => (f === 'fly_up' ? 'fly_down' : 'fly_up'))
    }, 120)
    return () => clearInterval(id)
  }, [flying])

  const frameKey = flying ? flapFrame : 'perched'

  return (
    <div
      className="bird"
      style={{
        width: BIRD_W * CELL,
        height: BIRD_H * CELL,
        transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`,
        transition: `transform ${durationMs}ms cubic-bezier(0.45, 0, 0.55, 1)`,
      }}
      aria-hidden="true"
    >
      <div className="bird-pixel" style={{ width: CELL, height: CELL, boxShadow: boxShadowFor(frameKey) }} />
    </div>
  )
}
