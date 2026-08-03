import { useEffect, useRef, useState } from 'react'
import Bird from './Bird'
import SkyDecor from './SkyDecor'
import GrassStrip from './GrassStrip'
import { CORNERS, SECTION_CONTENT, type SectionKey } from './sections'
import { STUMP_CELLS, STUMP_W, STUMP_H } from './stumpFrame'
import './Landing.css'

const FLIGHT_MS = 700
const IDLE_MS = 2000
const STUMP_CELL = 6
// Purely visual nudge so the stump's top surface lines up under the perched
// bird instead of the bird sitting mid-trunk. Does not affect stump-anchor's
// measured position, so flight-distance math to the corners stays accurate.
const STUMP_Y_NUDGE = 48

function centerOf(el: HTMLElement) {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

function stumpBoxShadow(): string {
  const shadows: string[] = []
  for (let i = 0; i < STUMP_CELLS.length; i += 2) {
    const row = STUMP_CELLS[i]
    const col = STUMP_CELLS[i + 1]
    shadows.push(`${col * STUMP_CELL}px ${row * STUMP_CELL + STUMP_Y_NUDGE}px 0 0 var(--ink)`)
  }
  return shadows.join(',')
}

export default function Landing() {
  const [birdOffset, setBirdOffset] = useState({ x: 0, y: 0 })
  const [flying, setFlying] = useState(false)
  const [target, setTarget] = useState<SectionKey | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const stumpRef = useRef<HTMLDivElement>(null)
  const cornerRefs = useRef<Partial<Record<SectionKey, HTMLButtonElement>>>({})
  const flightTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Mirrors the latest render's state so the delayed idle callback (scheduled
  // up to 2s ago) can check current flying/panelOpen instead of stale values.
  const latest = useRef({ flying, panelOpen })
  useEffect(() => {
    latest.current = { flying, panelOpen }
  })

  useEffect(() => {
    return () => {
      if (flightTimer.current) clearTimeout(flightTimer.current)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [])

  function flyTo(x: number, y: number, after?: () => void) {
    if (flightTimer.current) clearTimeout(flightTimer.current)
    setFlying(true)
    setBirdOffset({ x, y })
    flightTimer.current = setTimeout(() => {
      setFlying(false)
      after?.()
    }, FLIGHT_MS)
  }

  function goTo(key: SectionKey) {
    if (flying || panelOpen) return
    const stumpEl = stumpRef.current
    const cornerEl = cornerRefs.current[key]
    if (!stumpEl || !cornerEl) return
    const stumpCenter = centerOf(stumpEl)
    const cornerCenter = centerOf(cornerEl)
    setTarget(key)
    flyTo(cornerCenter.x - stumpCenter.x, cornerCenter.y - stumpCenter.y, () => setPanelOpen(true))
  }

  function goHome() {
    if (flying) return
    setPanelOpen(false)
    flyTo(0, 0, () => setTarget(null))
  }

  function handleBackgroundClick(e: React.MouseEvent<HTMLDivElement>) {
    if (flying || panelOpen) return
    if ((e.target as HTMLElement).closest('.corner-node')) return
    const stumpEl = stumpRef.current
    if (!stumpEl) return
    const stumpCenter = centerOf(stumpEl)
    flyTo(e.clientX - stumpCenter.x, e.clientY - stumpCenter.y)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const clientX = e.clientX
    const clientY = e.clientY
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      const { flying: isFlying, panelOpen: isPanelOpen } = latest.current
      if (isFlying || isPanelOpen) return
      const stumpEl = stumpRef.current
      if (!stumpEl) return
      const stumpCenter = centerOf(stumpEl)
      flyTo(clientX - stumpCenter.x, clientY - stumpCenter.y)
    }, IDLE_MS)
  }

  return (
    <div className="landing" onClick={handleBackgroundClick} onMouseMove={handleMouseMove}>
      <div className="sky-strip">
        <SkyDecor />
      </div>

      <GrassStrip />

      {CORNERS.map((c) => (
        <button
          key={c.key}
          type="button"
          ref={(el) => {
            if (el) cornerRefs.current[c.key] = el
          }}
          className={`corner-node corner-${c.key}`}
          onClick={() => goTo(c.key)}
          disabled={flying || panelOpen}
        >
          <span className="corner-glyph" aria-hidden="true">
            {c.glyph}
          </span>
          <span className="corner-label">{c.label}</span>
        </button>
      ))}

      <div className="wordmark-wrap">
        <p className="wordmark">Kai Castro</p>
        <p className="tagline">dj / producer</p>
      </div>

      <div
        className="stump-anchor"
        ref={stumpRef}
        style={{ width: STUMP_W * STUMP_CELL, height: STUMP_H * STUMP_CELL }}
      >
        <div
          className="stump-pixel"
          style={{ width: STUMP_CELL, height: STUMP_CELL, boxShadow: stumpBoxShadow() }}
          aria-hidden="true"
        />
      </div>

      <Bird flying={flying} offsetX={birdOffset.x} offsetY={birdOffset.y} durationMs={FLIGHT_MS} />

      {target && (
        <div className={`section-panel ${panelOpen ? 'is-open' : ''}`}>
          <button type="button" className="back-btn" onClick={goHome}>
            &lt; back to stump
          </button>
          <h1 className="panel-title">{SECTION_CONTENT[target].title}</h1>
          <p className="panel-body">{SECTION_CONTENT[target].body}</p>
          <ul className="panel-links">
            {SECTION_CONTENT[target].links.map((l) => (
              <li key={l.label}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
