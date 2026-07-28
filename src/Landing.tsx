import { useRef, useState } from 'react'
import Bird from './Bird'
import { CORNERS, SECTION_CONTENT, type SectionKey } from './sections'
import './Landing.css'

const FLIGHT_MS = 700

type Phase = 'idle' | 'flying-out' | 'panel' | 'flying-back'

function centerOf(el: HTMLElement) {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

export default function Landing() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [target, setTarget] = useState<SectionKey | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const nestRef = useRef<HTMLDivElement>(null)
  const cornerRefs = useRef<Partial<Record<SectionKey, HTMLButtonElement>>>({})

  const flying = phase === 'flying-out' || phase === 'flying-back'
  const atNest = phase === 'idle' || phase === 'flying-back'

  const offsetX = atNest ? '0px' : `${offset.x}px`
  const offsetY = atNest ? '0px' : `${offset.y}px`

  function goTo(key: SectionKey) {
    if (phase !== 'idle') return

    const nestEl = nestRef.current
    const cornerEl = cornerRefs.current[key]
    if (nestEl && cornerEl) {
      const nestCenter = centerOf(nestEl)
      const cornerCenter = centerOf(cornerEl)
      setOffset({ x: cornerCenter.x - nestCenter.x, y: cornerCenter.y - nestCenter.y })
    }

    setTarget(key)
    setPhase('flying-out')
    setTimeout(() => setPhase('panel'), FLIGHT_MS)
  }

  function goHome() {
    if (phase !== 'panel') return
    setPhase('flying-back')
    setTimeout(() => {
      setPhase('idle')
      setTarget(null)
    }, FLIGHT_MS)
  }

  return (
    <div className="landing">
      {CORNERS.map((c) => (
        <button
          key={c.key}
          type="button"
          ref={(el) => {
            if (el) cornerRefs.current[c.key] = el
          }}
          className={`corner-node corner-${c.key}`}
          onClick={() => goTo(c.key)}
          disabled={phase !== 'idle'}
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

      <Bird flying={flying} offsetX={offsetX} offsetY={offsetY} durationMs={FLIGHT_MS} />

      {target && (
        <div className={`section-panel ${phase === 'panel' ? 'is-open' : ''}`}>
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
