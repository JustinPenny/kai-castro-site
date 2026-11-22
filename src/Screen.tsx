import { useEffect, useRef, useState } from 'react'
import Buddy from './Buddy'
import BookingEmail from './BookingEmail'
import { BANDSINTOWN_URL, useShows } from './bandsintown'
import { SECTIONS, STAT_LABELS, type Action, type MenuItem, type SectionKey, type Stats } from './content'
// Section wheel: item i sits at (90 + (i + turn) * 90) degrees, so the item
// with (i + turn) % 4 === 0 is at the bottom, which is the highlight.
// Spinning right (turn + 1) brings the item on the right down into it.
const WHEEL: SectionKey[] = ['booking', 'shows', 'socials', 'streams']
const mod4 = (n: number) => ((n % 4) + 4) % 4
const WHEEL_TUCK_MS = 4000
// Shows starts highlighted: the turn that puts it at the bottom.
const START_TURN = -WHEEL.indexOf('shows')

// Device buttons, plus the pet actions (not wired to any control right now:
// call navRef.current?.('feed') from App to trigger one).
export type Nav = 'left' | 'right' | 'select' | 'back' | MenuItem

// An open page's highlightable items: its back button and links.
const pageItems = (page: Element) => [...page.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')]
// Temporarily off: the pet can't be clicked or highlighted (so Status is hidden too).
const BUDDY_SELECTABLE = false
const FLIGHT_MS = 700
const FOOD_DROP_MS = 400
const EAT_MS = 400
// Pose sequences (names are shown on the placeholder sprite, see Buddy.tsx).
const SEQUENCES: Record<Exclude<Action, 'feed'>, { poses: string[]; ms: number }> = {
  potty: { poses: ['potty 1', 'potty 2', 'potty 3'], ms: 700 },
  sleep: { poses: [1, 2, 3, 4, 5, 4, 5, 4, 3, 2, 1].map((n) => `sleep ${n}`), ms: 700 },
  play: { poses: ['fun 1', 'fun 2', 'fun 3', 'fun 2', 'fun 3', 'fun 1'], ms: 500 },
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const centerOf = (el: Element) => {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

export default function Screen({
  stats,
  navRef,
  ready,
  onAction,
}: {
  stats: Stats
  // Screen puts its handler here; App's device buttons call it directly, so
  // every press is handled even when several land before the next render.
  navRef: { current: ((item: Nav) => void) | null }
  // False while the intro plays, so the wheel doesn't tuck away before anyone sees it.
  ready: boolean
  onAction: (a: Action) => void
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [facingLeft, setFacingLeft] = useState(false)
  const [flying, setFlying] = useState(false)
  const [pose, setPose] = useState<string | null>(null)
  const [foods, setFoods] = useState<{ id: number; x: number; y: number }[]>([])
  const [section, setSection] = useState<SectionKey | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [acting, setActing] = useState(false)
  const [turn, setTurn] = useState(START_TURN)
  const turnRef = useRef(START_TURN) // latest turn, even between quick presses
  const highlighted = WHEEL[mod4(-turn)]
  // After WHEEL_TUCK_MS without a spin, the other options slide off the screen
  // (App.css, .wheel.is-tucked); a spin brings them back and restarts the clock.
  // While tucked, slivers at the edges bring the options back on hover or tap,
  // and they won't tuck again while the mouse is over one of them (`hold`).
  const [tucked, setTucked] = useState(false)
  const [hold, setHold] = useState(false)
  useEffect(() => {
    if (!ready || tucked || hold) return
    const id = setTimeout(() => setTucked(true), WHEEL_TUCK_MS)
    return () => clearTimeout(id)
  }, [ready, tucked, hold, turn])
  const untuck = () => setTucked(false)
  const spin = (by: number) => {
    turnRef.current += by
    setTurn(turnRef.current)
    setTucked(false)
  }
  const shows = useShows(highlighted === 'shows' || section === 'shows')

  const screenRef = useRef<HTMLDivElement>(null)
  const homeRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Partial<Record<SectionKey, HTMLButtonElement>>>({})
  const posRef = useRef(pos)
  const busy = useRef(false) // sync mirror of `acting` so double presses can't start two actions
  const alive = useRef(true)
  const foodId = useRef(0)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const blocked = flying || panelOpen || statsOpen || acting

  function flyTo(x: number, y: number) {
    if (x - posRef.current.x > 2) setFacingLeft(false)
    else if (x - posRef.current.x < -2) setFacingLeft(true)
    posRef.current = { x, y }
    setPos({ x, y })
    setFlying(true)
    return wait(FLIGHT_MS).then(() => alive.current && setFlying(false))
  }

  async function run(action: Action) {
    if (busy.current || panelOpen || statsOpen || flying) return
    busy.current = true
    setActing(true)
    onAction(action)
    if (action === 'feed') await feed()
    else {
      for (const p of SEQUENCES[action].poses) {
        if (!alive.current) return
        setPose(p)
        await wait(SEQUENCES[action].ms)
      }
    }
    setPose(null)
    busy.current = false
    setActing(false)
  }

  // Drop 1-3 pellets near the center, walk to each and eat it, go home.
  async function feed() {
    const el = screenRef.current
    if (!el) return
    const w = el.clientWidth
    const placed: { id: number; x: number; y: number }[] = []
    const count = 1 + Math.floor(Math.random() * 3)
    while (placed.length < count) {
      const a = Math.random() * Math.PI * 2
      const d = w * (0.12 + Math.random() * 0.1)
      const f = { id: ++foodId.current, x: Math.cos(a) * d, y: Math.sin(a) * d * 0.6 }
      if (placed.every((p) => Math.hypot(p.x - f.x, p.y - f.y) > w * 0.12)) placed.push(f)
    }
    setFoods(placed)
    await wait(FOOD_DROP_MS)
    for (const f of placed) {
      if (!alive.current) return
      const dir = f.x >= posRef.current.x ? 1 : -1
      await flyTo(f.x - w * 0.1 * dir, f.y - w * 0.06)
      setPose('eat 1')
      await wait(EAT_MS)
      setPose('eat 2')
      await wait(EAT_MS)
      setPose(null)
      setFoods((fs) => fs.filter((x) => x.id !== f.id))
    }
    await flyTo(0, 0)
  }

  async function goTo(key: SectionKey) {
    const home = homeRef.current
    const item = itemRefs.current[key]
    if (blocked || !home || !item) return
    const h = centerOf(home)
    const c = centerOf(item)
    setSection(key)
    await flyTo(c.x - h.x, c.y - h.y)
    setPanelOpen(true)
  }

  function openStats() {
    if (!blocked) setStatsOpen(true)
  }

  async function back() {
    if (statsOpen) return setStatsOpen(false)
    if (!panelOpen || flying) return
    setPanelOpen(false)
    await flyTo(0, 0)
    setSection(null)
  }

  // On an open page the arrows move a highlight (a data attribute React
  // doesn't manage, so re-renders keep it) over its back button and links.
  function stepPage(page: Element, dir: 1 | -1) {
    const items = pageItems(page)
    if (!items.length) return
    const cur = items.findIndex((el) => el.hasAttribute('data-hl'))
    items.forEach((el) => el.removeAttribute('data-hl'))
    const next = cur === -1 ? (dir === 1 ? 0 : items.length - 1) : (cur + dir + items.length) % items.length
    items[next].setAttribute('data-hl', '')
  }

  // Device buttons (and, later, pet actions) come in here.
  const nav = (item: Nav) => {
    const page = screenRef.current?.querySelector('.lcd-page:not(.section), .lcd-page.is-open')
    if (item === 'left' || item === 'right') {
      const dir = item === 'right' ? 1 : -1
      if (page) stepPage(page, dir)
      else if (!blocked) spin(dir)
    } else if (item === 'select') {
      if (page) pageItems(page).find((el) => el.hasAttribute('data-hl'))?.click()
      else void goTo(WHEEL[mod4(-turnRef.current)])
    } else if (item === 'back') void back()
    else if (item === 'stats') openStats()
    else void run(item)
  }
  navRef.current = nav

  function handleClick(e: React.MouseEvent) {
    if (blocked || (e.target as HTMLElement).closest('button, a')) return
    const home = homeRef.current
    if (!home) return
    const h = centerOf(home)
    void flyTo(e.clientX - h.x, e.clientY - h.y)
  }

  return (
    <div
      ref={screenRef}
      className="lcd"
      onClick={handleClick}
    >
      <ul className={`wheel${tucked ? ' is-tucked' : ''}`} style={{ '--turn': turn } as React.CSSProperties} aria-label="Sections">
        {WHEEL.map((key, i) => {
          const at = mod4(i + turn) // 0 bottom, 1 left, 2 top, 3 right
          return (
            <li
              key={key}
              className={`wheel-slot${at === 0 ? ' is-current' : ''}`}
              style={{ '--i': i } as React.CSSProperties}
              onMouseEnter={() => setHold(true)}
              onMouseLeave={() => setHold(false)}
            >
              {at === 0 && (
                <button
                  type="button"
                  className="wheel-arrow wheel-arrow-left"
                  aria-label="Previous section"
                  disabled={blocked}
                  onClick={() => nav('left')}
                />
              )}
              <button
                type="button"
                className="wheel-item"
                aria-current={at === 0 ? 'true' : undefined}
                ref={(el) => {
                  if (el) itemRefs.current[key] = el
                }}
                disabled={blocked}
                // Clicking the highlighted item opens it; any other spins it down.
                onClick={() => (at === 0 ? goTo(key) : spin(at === 3 ? 1 : -at))}
              >
                {SECTIONS[key].title}
              </button>
              {at === 0 && (
                <button
                  type="button"
                  className="wheel-arrow wheel-arrow-right"
                  aria-label="Next section"
                  disabled={blocked}
                  onClick={() => nav('right')}
                />
              )}
            </li>
          )
        })}
      </ul>
      {tucked &&
        (['left', 'top', 'right'] as const).map((side) => (
          <button
            key={side}
            type="button"
            className={`wheel-peek wheel-peek-${side}`}
            aria-label="Show all sections"
            onMouseEnter={untuck}
            onClick={untuck}
          />
        ))}

      <div className="home" ref={homeRef} aria-hidden="true" />

      {foods.map((f) => (
        <div key={f.id} className="food" style={{ translate: `calc(-50% + ${f.x}px) calc(-50% + ${f.y}px)` }} />
      ))}

      <Buddy
        pose={pose}
        flying={flying}
        x={pos.x}
        y={pos.y}
        facingLeft={facingLeft}
        durationMs={FLIGHT_MS}
        disabled={!BUDDY_SELECTABLE || blocked}
        onClick={openStats}
      />

      {statsOpen && (
        <div className="lcd-page">
          <button type="button" className="back-btn" onClick={() => setStatsOpen(false)}>
            &lt; back
          </button>
          <h2 className="page-title">Status</h2>
          <ul className="stats">
            {(Object.keys(STAT_LABELS) as (keyof Stats)[]).map((k) => (
              <li key={k}>
                <span>{STAT_LABELS[k]}</span>
                <div className="stat-bar" role="progressbar" aria-label={STAT_LABELS[k]} aria-valuemin={0} aria-valuemax={100} aria-valuenow={stats[k]}>
                  <div className="stat-fill" style={{ width: `${stats[k]}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {section && (
        <div className={`lcd-page section${panelOpen ? ' is-open' : ''}`}>
          <button type="button" className="back-btn" onClick={() => void back()}>
            &lt; back
          </button>
          <h2 className="page-title">{SECTIONS[section].title}</h2>
          {SECTIONS[section].body && <p className="page-body">{SECTIONS[section].body}</p>}
          <ul className="page-links">
            {section === 'booking' && panelOpen && (
              <li>
                <BookingEmail />
              </li>
            )}
            {section === 'shows' ? (
              <>
                {shows.status === 'loading' && <li className="panel-status">Loading dates...</li>}
                {shows.status === 'error' && (
                  <li>
                    <a href={BANDSINTOWN_URL}>Dates on Bandsintown</a>
                  </li>
                )}
                {shows.status === 'ready' && shows.shows.length === 0 && <li className="panel-status">No shows booked -- check back soon.</li>}
                {shows.shows.map((s) => (
                  <li key={s.id}>
                    <a href={s.url}>{s.label}</a>
                  </li>
                ))}
              </>
            ) : (
              SECTIONS[section].links.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

