import { useEffect, useRef, useState } from 'react'
import Bird from './Bird'
import { CORNERS, SECTION_CONTENT, type SectionKey } from './sections'
import './Landing.css'

const FLIGHT_MS = 700
const IDLE_MS = 2000

function centerOf(el: HTMLElement) {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

export default function Landing() {
  const [birdOffset, setBirdOffset] = useState({ x: 0, y: 0 })
  const [flying, setFlying] = useState(false)
  const [target, setTarget] = useState<SectionKey | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const nestRef = useRef<HTMLDivElement>(null)
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
    const nestEl = nestRef.current
    const cornerEl = cornerRefs.current[key]
    if (!nestEl || !cornerEl) return
    const nestCenter = centerOf(nestEl)
    const cornerCenter = centerOf(cornerEl)
    setTarget(key)
    flyTo(cornerCenter.x - nestCenter.x, cornerCenter.y - nestCenter.y, () => setPanelOpen(true))
  }

  function goHome() {
    if (flying) return
    setPanelOpen(false)
    flyTo(0, 0, () => setTarget(null))
  }

  function handleBackgroundClick(e: React.MouseEvent<HTMLDivElement>) {
    if (flying || panelOpen) return
    if ((e.target as HTMLElement).closest('.corner-node')) return
    const nestEl = nestRef.current
    if (!nestEl) return
    const nestCenter = centerOf(nestEl)
    flyTo(e.clientX - nestCenter.x, e.clientY - nestCenter.y)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const clientX = e.clientX
    const clientY = e.clientY
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      const { flying: isFlying, panelOpen: isPanelOpen } = latest.current
      if (isFlying || isPanelOpen) return
      const nestEl = nestRef.current
      if (!nestEl) return
      const nestCenter = centerOf(nestEl)
      flyTo(clientX - nestCenter.x, clientY - nestCenter.y)
    }, IDLE_MS)
  }

  return (
    <div className="landing" onClick={handleBackgroundClick} onMouseMove={handleMouseMove}>
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

      <div className="nest-anchor" ref={nestRef}>
        <div className="nest-pixel" aria-hidden="true" />
      </div>

      <Bird flying={flying} offsetX={birdOffset.x} offsetY={birdOffset.y} durationMs={FLIGHT_MS} />

      {target && (
        <div className={`section-panel ${panelOpen ? 'is-open' : ''}`}>
          <button type="button" className="back-btn" onClick={goHome}>
            &lt; back to nest
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
