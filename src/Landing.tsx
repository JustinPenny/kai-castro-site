import { useEffect, useRef, useState } from 'react'
import Bird from './Bird'
import { CORNERS, SECTION_CONTENT, type SectionKey } from './sections'
import { useBandsintownShows } from './useBandsintownShows'
import { formatShowLabel, BANDSINTOWN_ARTIST_URL } from './bandsintown'
import './Landing.css'

const FLIGHT_MS = 700
// Food: a little pellet (1/16 of the buddy sprite) dropped near the buddy.
const FOOD_DROP_MS = 400
const EAT_FRAME_MS = 400
const MIN_FOOD = 1
const MAX_FOOD = 3
// Where the beak sits relative to the sprite center (sprite faces right).
const BEAK_DX = 50
const BEAK_DY = 45

interface Food {
  id: number
  x: number
  y: number
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function centerOf(el: HTMLElement) {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

export default function Landing({ feedTick = 0 }: { feedTick?: number }) {
  const [birdOffset, setBirdOffset] = useState({ x: 0, y: 0 })
  const [flying, setFlying] = useState(false)
  const [target, setTarget] = useState<SectionKey | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [foods, setFoods] = useState<Food[]>([])
  const [eatFrame, setEatFrame] = useState<0 | 1 | 2>(0)
  const [feeding, setFeeding] = useState(false)

  const { shows, status: showsStatus } = useBandsintownShows()

  const homeRef = useRef<HTMLDivElement>(null)
  const cornerRefs = useRef<Partial<Record<SectionKey, HTMLButtonElement>>>({})
  const flightTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const landingRef = useRef<HTMLDivElement>(null)
  const birdPos = useRef({ x: 0, y: 0 })
  const facing = useRef(1)
  const alive = useRef(true)
  const feedingRef = useRef(false)
  const panelRef = useRef(false)
  const foodId = useRef(0)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      if (flightTimer.current) clearTimeout(flightTimer.current)
    }
  }, [])

  useEffect(() => {
    panelRef.current = panelOpen
  }, [panelOpen])

  useEffect(() => {
    if (feedTick > 0) void feed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedTick])

  function flyTo(x: number, y: number, after?: () => void) {
    if (flightTimer.current) clearTimeout(flightTimer.current)
    setFlying(true)
    if (x - birdPos.current.x > 2) facing.current = 1
    else if (x - birdPos.current.x < -2) facing.current = -1
    birdPos.current = { x, y }
    setBirdOffset({ x, y })
    flightTimer.current = setTimeout(() => {
      setFlying(false)
      after?.()
    }, FLIGHT_MS)
  }

  function flyToAsync(x: number, y: number) {
    return new Promise<void>((resolve) => flyTo(x, y, resolve))
  }

  // Drop 1-3 pellets near the buddy, then have it walk to each and eat it
  // (eat pose 1, then 2).
  async function feed() {
    if (feedingRef.current || panelRef.current || false) return
    const el = landingRef.current
    if (!el) return
    feedingRef.current = true
    setFeeding(true)

    const count = MIN_FOOD + Math.floor(Math.random() * (MAX_FOOD - MIN_FOOD + 1))
    // Food stays in a tight area around the screen center.
    const maxX = Math.min(el.clientWidth * 0.25, 100)
    const maxY = Math.min(el.clientHeight * 0.2, 100)
    const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v))
    const placed: Food[] = []
    for (let i = 0; i < count; i++) {
      let x = 0
      let y = 0
      for (let tries = 0; tries < 20; tries++) {
        const angle = Math.random() * Math.PI * 2
        const dist = 50 + Math.random() * 50
        x = clamp(Math.cos(angle) * dist, maxX)
        y = clamp(Math.sin(angle) * dist, maxY)
        if (placed.every((p) => Math.hypot(p.x - x, p.y - y) > 50)) break
      }
      placed.push({ id: ++foodId.current, x, y })
    }
    setFoods(placed)
    await wait(FOOD_DROP_MS)

    for (const food of placed) {
      if (!alive.current) return
      const dir = food.x - birdPos.current.x > 2 ? 1 : food.x - birdPos.current.x < -2 ? -1 : facing.current
      await flyToAsync(food.x - BEAK_DX * dir, food.y - BEAK_DY)
      if (!alive.current) return
      setEatFrame(1)
      await wait(EAT_FRAME_MS)
      setEatFrame(2)
      await wait(EAT_FRAME_MS)
      setEatFrame(0)
      setFoods((fs) => fs.filter((f) => f.id !== food.id))
    }
    await flyToAsync(0, 0)
    if (!alive.current) return
    feedingRef.current = false
    setFeeding(false)
  }

  function goTo(key: SectionKey) {
    if (flying || panelOpen || feeding) return
    const homeEl = homeRef.current
    const cornerEl = cornerRefs.current[key]
    if (!homeEl || !cornerEl) return
    const home = centerOf(homeEl)
    const corner = centerOf(cornerEl)
    setTarget(key)
    flyTo(corner.x - home.x, corner.y - home.y, () => setPanelOpen(true))
  }

  function goHome() {
    if (flying || feeding) return
    setPanelOpen(false)
    flyTo(0, 0, () => setTarget(null))
  }

  function handleBackgroundClick(e: React.MouseEvent<HTMLDivElement>) {
    if (flying || panelOpen || feeding) return
    // The corner buttons handle their own clicks; don't also fire a second,
    // conflicting flight from the bubbled-up background click.
    if ((e.target as HTMLElement).closest('.corner-group')) return
    const homeEl = homeRef.current
    if (!homeEl) return
    const home = centerOf(homeEl)
    flyTo(e.clientX - home.x, e.clientY - home.y)
  }

  return (
    <div className="landing" ref={landingRef} onClick={handleBackgroundClick}>
      {CORNERS.map((c) => (
        <div key={c.key} className={`corner-group corner-${c.key}`}>
          <button
            type="button"
            ref={(el) => {
              if (el) cornerRefs.current[c.key] = el
            }}
            className="corner-node"
            onClick={() => goTo(c.key)}
            disabled={flying || panelOpen || feeding}
          >
            <span className="corner-label">{c.label}</span>
          </button>
        </div>
      ))}

      {/* Invisible marker at the screen's center: the buddy's resting spot,
          and the origin every flight offset is measured from. */}
      <div className="stump-anchor" ref={homeRef} aria-hidden="true" />

      {foods.map((f) => (
        <div
          key={f.id}
          className="food"
          style={{ translate: `calc(-50% + ${f.x}px) calc(-50% + ${f.y}px)` }}
        >
          <div className="food-pellet" />
        </div>
      ))}

      <Bird eatFrame={eatFrame} flying={flying} offsetX={birdOffset.x} offsetY={birdOffset.y} durationMs={FLIGHT_MS} />

      {target && (
        <div className={`section-panel ${panelOpen ? 'is-open' : ''}`}>
          <button type="button" className="back-btn" onClick={goHome}>
            &lt; back
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
