import { useEffect, useRef, useState } from 'react'
import Buddy from './Buddy'
import BookingEmail from './BookingEmail'
import { BANDSINTOWN_URL, useShows } from './bandsintown'
import { MENU, SECTIONS, STAT_LABELS, type Action, type MenuItem, type SectionKey, type Stats } from './content'
const CORNERS: SectionKey[] = ['booking', 'shows', 'streams', 'socials']
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
  selected,
  command,
  onAction,
}: {
  stats: Stats
  selected: number | null
  command: { item: MenuItem | 'back'; n: number } | null
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
  const [hoverBuddy, setHoverBuddy] = useState(false)
  const [acting, setActing] = useState(false)
  const shows = useShows()

  const screenRef = useRef<HTMLDivElement>(null)
  const homeRef = useRef<HTMLDivElement>(null)
  const cornerRefs = useRef<Partial<Record<SectionKey, HTMLButtonElement>>>({})
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
  // Buddy sprite width scales with the screen, so hit-testing does too.
  const buddyRadius = () => (screenRef.current?.clientWidth ?? 300) * 0.16

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
    const corner = cornerRefs.current[key]
    if (blocked || !home || !corner) return
    const h = centerOf(home)
    const c = centerOf(corner)
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

  // Device buttons (App.tsx) arrive here as commands.
  useEffect(() => {
    if (!command) return
    if (command.item === 'back') void back()
    else if (command.item === 'stats') openStats()
    else void run(command.item)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command])

  function overBuddy(e: React.MouseEvent) {
    const home = homeRef.current
    if (!home) return false
    const h = centerOf(home)
    return Math.hypot(e.clientX - h.x - posRef.current.x, e.clientY - h.y - posRef.current.y) <= buddyRadius()
  }

  function handleClick(e: React.MouseEvent) {
    if (blocked || (e.target as HTMLElement).closest('button, a')) return
    if (overBuddy(e)) return openStats()
    const home = homeRef.current
    if (!home) return
    const h = centerOf(home)
    void flyTo(e.clientX - h.x, e.clientY - h.y)
  }

  return (
    <div
      ref={screenRef}
      className={`lcd${hoverBuddy ? ' is-hovering-buddy' : ''}`}
      onClick={handleClick}
      onMouseMove={(e) => setHoverBuddy(!blocked && overBuddy(e))}
      onMouseLeave={() => setHoverBuddy(false)}
    >
      <ul className="lcd-menu" aria-label="Pet menu">
        {MENU.map(({ item, label, icon }, i) => (
          <li key={item}>
            <button
              type="button"
              aria-label={label}
              aria-current={selected === i ? 'true' : undefined}
              className="lcd-menu-item"
              onClick={() => (item === 'stats' ? openStats() : void run(item))}
            >
              {icon ? <img src={icon} alt="" /> : <StatsIcon />}
            </button>
          </li>
        ))}
      </ul>

      {CORNERS.map((key) => (
        <button
          key={key}
          type="button"
          className={`corner corner-${key}`}
          ref={(el) => {
            if (el) cornerRefs.current[key] = el
          }}
          disabled={blocked}
          onClick={() => goTo(key)}
        >
          {SECTIONS[key].title}
        </button>
      ))}

      <div className="home" ref={homeRef} aria-hidden="true" />

      {foods.map((f) => (
        <div key={f.id} className="food" style={{ translate: `calc(-50% + ${f.x}px) calc(-50% + ${f.y}px)` }} />
      ))}

      {hoverBuddy && <div className="buddy-highlight" style={{ translate: `calc(-50% + ${pos.x}px) calc(-50% + ${pos.y}px)` }} />}

      <Buddy pose={pose} flying={flying} x={pos.x} y={pos.y} facingLeft={facingLeft} durationMs={FLIGHT_MS} />

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

function StatsIcon() {
  return (
    <svg viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="1" y="4" width="1" height="3" />
      <rect x="3" y="2" width="1" height="5" />
      <rect x="5" y="1" width="1" height="6" />
      <rect x="0" y="7" width="8" height="1" />
    </svg>
  )
}
