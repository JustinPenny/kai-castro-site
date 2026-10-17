import { useEffect, useRef, useState } from 'react'
import Bird from './Bird'
import BirdBurst from './BirdBurst'
import Confetti from './Confetti'
import SkyDecor from './SkyDecor'
import GrassStrip from './GrassStrip'
import Worm, { type WormHandle } from './Worm'
import { CORNERS, SECTION_CONTENT, type SectionKey } from './sections'
import { STUMP_CELLS, STUMP_W, STUMP_H } from './stumpFrame'
import { useBandsintownShows } from './useBandsintownShows'
import { formatShowLabel, BANDSINTOWN_ARTIST_URL } from './bandsintown'
import treeImg from './assets/tree.webp'
import headphonesImg from './assets/headphones.webp'
import lampPostImg from './assets/lamp_post.webp'
import handImg from './assets/hand.webp'
import './Landing.css'

const FLIGHT_MS = 700
const STUMP_CELL = 6
// Purely visual nudge so the stump's top surface lines up under the perched
// bird instead of the bird sitting mid-trunk. Does not affect stump-anchor's
// measured position, so flight-distance math to the corners stays accurate.
const STUMP_Y_NUDGE = 48

// Worm minigame: 5% bird growth per worm eaten, celebration (confetti +
// flash + explode + reset) once growth reaches 50% (i.e. the 10th worm).
const WORM_GROWTH_STEP = 0.05
const CELEBRATION_THRESHOLD = 0.5
const FLOATY_LIFETIME_MS = 1100 // matches the floaty-rise keyframe duration
const CELEBRATION_FLASH_MS = 400 // how long the white-flash phase runs
const CELEBRATION_TOTAL_MS = 900 // flash + explode, before the bird resets

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

  const { shows, status: showsStatus } = useBandsintownShows()

  const [birdGrowth, setBirdGrowth] = useState(0)
  const [floatyTexts, setFloatyTexts] = useState<{ id: number; x: number; y: number }[]>([])
  const [celebrating, setCelebrating] = useState(false)
  const [birdFlash, setBirdFlash] = useState(false)
  const [birdExploding, setBirdExploding] = useState(false)
  const [confettiBurstId, setConfettiBurstId] = useState(0)

  const stumpRef = useRef<HTMLDivElement>(null)
  const cornerRefs = useRef<Partial<Record<SectionKey, HTMLButtonElement>>>({})
  const wormRef = useRef<WormHandle>(null)
  const flightTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const floatyId = useRef(0)
  // True while the bird is mid-flight specifically to go eat a worm, so
  // flyTo can tell a worm-bound flight apart from every other kind (corner
  // clicks, background clicks) and cancel the worm's "waiting to be eaten"
  // state if one of those redirects the bird first.
  const wormFlightPending = useRef(false)

  useEffect(() => {
    return () => {
      if (flightTimer.current) clearTimeout(flightTimer.current)
    }
  }, [])

  // Once growth hits the celebration threshold, kick off the flash/explode/
  // reset sequence (see the effect below) -- done as a separate effect
  // instead of inline in the setState updater so it stays a pure side
  // effect of state settling, not of the update itself.
  useEffect(() => {
    if (birdGrowth >= CELEBRATION_THRESHOLD - 1e-9) {
      setCelebrating(true)
    }
  }, [birdGrowth])

  useEffect(() => {
    if (!celebrating) return
    setBirdFlash(true)
    setConfettiBurstId((n) => n + 1)
    const toExplode = setTimeout(() => {
      setBirdFlash(false)
      setBirdExploding(true)
    }, CELEBRATION_FLASH_MS)
    const toReset = setTimeout(() => {
      setBirdExploding(false)
      setBirdGrowth(0)
      setCelebrating(false)
    }, CELEBRATION_TOTAL_MS)
    return () => {
      clearTimeout(toExplode)
      clearTimeout(toReset)
    }
  }, [celebrating])

  // Fires once the bird has actually landed on the worm (see flyTo's
  // `after` callback in handleWormClick below) -- not at the moment it's
  // clicked, so the "+1" and growth land right when the bird gets there.
  function handleWormEaten() {
    const id = floatyId.current++
    setFloatyTexts((prev) => [...prev, { id, x: birdOffset.x, y: birdOffset.y }])
    setTimeout(() => {
      setFloatyTexts((prev) => prev.filter((f) => f.id !== id))
    }, FLOATY_LIFETIME_MS)

    setBirdGrowth((prev) => Math.min(prev + WORM_GROWTH_STEP, CELEBRATION_THRESHOLD))
  }

  function flyTo(x: number, y: number, after?: () => void, isWormFlight = false) {
    // Any flight that isn't itself heading for the worm supersedes a
    // pending one -- tell the worm to stop waiting instead of leaving it
    // stuck in its "about to be eaten" state forever.
    if (!isWormFlight && wormFlightPending.current) {
      wormFlightPending.current = false
      wormRef.current?.cancelPending()
    }
    if (flightTimer.current) clearTimeout(flightTimer.current)
    setFlying(true)
    setBirdOffset({ x, y })
    wormFlightPending.current = isWormFlight
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

  function handleWormClick(point: { x: number; y: number }) {
    if (flying || panelOpen) return
    const stumpEl = stumpRef.current
    if (!stumpEl) return
    const stumpCenter = centerOf(stumpEl)
    flyTo(
      point.x - stumpCenter.x,
      point.y - stumpCenter.y,
      () => {
        // Only actually eat it if this specific worm flight wasn't
        // superseded (cancelPending already reset wormFlightPending) by
        // another click before the bird got there.
        if (wormFlightPending.current) {
          wormFlightPending.current = false
          wormRef.current?.triggerEaten()
          handleWormEaten()
        }
      },
      true,
    )
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

  return (
    <div className="landing" onClick={handleBackgroundClick}>
      <SkyDecor />

      <GrassStrip />

      <Worm ref={wormRef} onWormClick={handleWormClick} />

      <img className="tree-shows" src={treeImg} alt="" aria-hidden="true" />

      <img className="lamp-booking" src={lampPostImg} alt="" aria-hidden="true" />

      <img className="headphones-corner" src={headphonesImg} alt="" aria-hidden="true" />

      <img className="hand-corner" src={handImg} alt="" aria-hidden="true" />

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
          <span className="corner-bracket tl" aria-hidden="true" />
          <span className="corner-bracket tr" aria-hidden="true" />
          <span className="corner-bracket bl" aria-hidden="true" />
          <span className="corner-bracket br" aria-hidden="true" />
          <c.Icon className="corner-glyph" aria-hidden="true" />
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

      {birdExploding ? (
        <BirdBurst offsetX={birdOffset.x} offsetY={birdOffset.y} />
      ) : (
        <Bird
          flying={flying}
          offsetX={birdOffset.x}
          offsetY={birdOffset.y}
          durationMs={FLIGHT_MS}
          growthScale={1 + birdGrowth}
          flashing={birdFlash}
        />
      )}

      {floatyTexts.map((f) => (
        <span
          key={f.id}
          className="floaty-plus-one"
          style={{ translate: `calc(-50% + ${f.x}px) calc(-50% + ${f.y}px)` }}
          aria-hidden="true"
        >
          +1
        </span>
      ))}

      <Confetti burstId={confettiBurstId} />

      {target && (
        <div className={`section-panel ${panelOpen ? 'is-open' : ''}`}>
          <button type="button" className="back-btn" onClick={goHome}>
            &lt; back to stump
          </button>
          <h1 className="panel-title">{SECTION_CONTENT[target].title}</h1>
          {SECTION_CONTENT[target].body && <p className="panel-body">{SECTION_CONTENT[target].body}</p>}
          {target === 'shows' ? (
            <ul className="panel-links">
              {showsStatus === 'loading' && <li className="panel-status">Loading dates...</li>}
              {showsStatus === 'error' && (
                <li>
                  <a href={BANDSINTOWN_ARTIST_URL}>See dates on Bandsintown</a>
                </li>
              )}
              {showsStatus === 'ready' && shows.length === 0 && (
                <li className="panel-status">No shows booked right now -- check back soon.</li>
              )}
              {showsStatus === 'ready' &&
                shows.map((show) => (
                  <li key={show.id}>
                    <a href={show.url}>{formatShowLabel(show)}</a>
                  </li>
                ))}
            </ul>
          ) : (
            <ul className="panel-links">
              {SECTION_CONTENT[target].links.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
