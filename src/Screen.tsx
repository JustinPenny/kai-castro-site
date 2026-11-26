import { useEffect, useRef, useState } from 'react'
import Buddy from './Buddy'
import { BANDSINTOWN_URL, useShows } from './bandsintown'
import { SECTIONS, type Action, type SectionKey } from './content'
// Section wheel: item i sits at (90 + (i + turn) * 90) degrees, so the item
// with (i + turn) % 4 === 0 is at the bottom, which is the highlight.
// Spinning right (turn + 1) brings the item on the right down into it.
const WHEEL: SectionKey[] = ['booking', 'shows', 'socials', 'streams']
const mod4 = (n: number) => ((n % 4) + 4) % 4
const WHEEL_TUCK_MS = 4000
// Wheel radii (cqh): the others, the selected one (lower), and tucked away.
const WHEEL_R = 33
const WHEEL_R_CURRENT = 39
const WHEEL_R_TUCKED = 75
// Shows starts highlighted: the turn that puts it at the bottom.
const START_TURN = -WHEEL.indexOf('shows')
// Buddy's wheel: his actions, printed on the backs of the section boxes
// (PET_WHEEL[i] behind WHEEL[i]); clicking him flips the boxes over.
// Rotated so Feed is behind Shows, the box highlighted at the start.
const PET_WHEEL: Action[] = ['play', 'feed', 'sleep', 'potty']
const PET_LABELS: Record<Action, string> = { feed: 'Feed', sleep: 'Sleep', potty: 'Potty', play: 'Play' }
type Menu = 'sections' | 'pet'

// Device buttons (plus arrow keys and swipes, see App.tsx), and the pet
// actions by name.
export type Nav = 'left' | 'right' | 'select' | 'back' | Action

// Links that leave the toy (other sites, and files like the press kit) open in
// a new tab; mailto: links don't.
const external = (href: string) =>
  /^(https?:|\/)/.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {}

// An open page's highlightable items: its back button and links.
const pageItems = (page: Element) => [...page.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')]
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
  navRef,
  ready,
}: {
  // Screen puts its handler here; App's device buttons call it directly, so
  // every press is handled even when several land before the next render.
  navRef: { current: ((item: Nav) => void) | null }
  // False while the intro plays, so the wheel doesn't tuck away before anyone sees it.
  ready: boolean
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [facingLeft, setFacingLeft] = useState(false)
  const [flying, setFlying] = useState(false)
  const [pose, setPose] = useState<string | null>(null)
  const [foods, setFoods] = useState<{ id: number; x: number; y: number }[]>([])
  const [section, setSection] = useState<SectionKey | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [acting, setActing] = useState(false)
  // Which wheel shows, and each wheel's own turn.
  const [menu, setMenu] = useState<Menu>('sections')
  // One turn for both sides of the wheel: flipping keeps every box in place.
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
  }, [ready, tucked, hold, turn, menu])
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

  const blocked = flying || panelOpen || acting

  function flyTo(x: number, y: number) {
    if (x - posRef.current.x > 2) setFacingLeft(false)
    else if (x - posRef.current.x < -2) setFacingLeft(true)
    posRef.current = { x, y }
    setPos({ x, y })
    setFlying(true)
    return wait(FLIGHT_MS).then(() => alive.current && setFlying(false))
  }

  async function run(action: Action) {
    if (busy.current || panelOpen || flying) return
    busy.current = true
    setActing(true)
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
    // The section page is already in the DOM (invisible) from setSection, so
    // its title's spot can be measured.
    const title = screenRef.current?.querySelector<HTMLElement>('.lcd-page.section .page-title')
    const slide = title ? slideBox(item, title, true) : Promise.resolve()
    setPanelOpen(true)
    await slide
  }

  // Shared-element slide between the selected wheel box and the page title
  // (same text): toward the title when a section opens, back down to the
  // wheel when it closes. Two copies of the box move together, the dark box
  // and the plain title text, cross-fading, so only transform and opacity
  // animate and the GPU does all of it (colour animations would pull the
  // whole thing back onto the main thread).
  function slideBox(item: HTMLElement, title: HTMLElement, toTitle: boolean) {
    const lcd = screenRef.current
    if (!lcd || matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve()
    const box = lcd.getBoundingClientRect()
    const at = item.getBoundingClientRect()
    const text = document.createRange()
    text.selectNodeContents(title)
    const to = text.getBoundingClientRect()
    const scale = parseFloat(getComputedStyle(title).fontSize) / parseFloat(getComputedStyle(item).fontSize)
    const dx = to.left + to.width / 2 - (at.left + at.width / 2)
    const dy = to.top + to.height / 2 - (at.top + at.height / 2)
    const onItem = 'translate(0, 0) scale(1)'
    const onTitle = `translate(${dx}px, ${dy}px) scale(${scale})`
    const [start, end] = toTitle ? [onItem, onTitle] : [onTitle, onItem]
    const copy = (asTitle: boolean) => {
      const c = item.cloneNode(true) as HTMLElement
      c.setAttribute('aria-hidden', 'true')
      Object.assign(c.style, {
        position: 'absolute',
        left: `${at.left - box.left}px`,
        top: `${at.top - box.top}px`,
        width: `${at.width}px`,
        height: `${at.height}px`,
        margin: '0',
        zIndex: '30',
        pointerEvents: 'none',
        transition: 'none',
      })
      if (asTitle) Object.assign(c.style, { background: 'transparent', borderColor: 'transparent', color: 'var(--ink)' })
      lcd.append(c)
      return c
    }
    const boxCopy = copy(false)
    const textCopy = copy(true)
    // Unmanaged by React (no style prop on either), so this is safe to toggle.
    title.style.visibility = 'hidden'
    item.style.visibility = 'hidden'
    // fill: hold the end state until the copies are removed (no one-frame flash).
    const timing = { duration: 550, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' } as const
    const anims = [
      boxCopy.animate([{ transform: start, opacity: toTitle ? 1 : 0 }, { transform: end, opacity: toTitle ? 0 : 1 }], timing),
      textCopy.animate([{ transform: start, opacity: toTitle ? 0 : 1 }, { transform: end, opacity: toTitle ? 1 : 0 }], timing),
    ]
    return Promise.all(anims.map((a) => a.finished))
      .catch(() => {})
      .finally(() => {
        title.style.visibility = ''
        item.style.visibility = ''
        boxCopy.remove()
        textCopy.remove()
      })
  }

  // Clicking buddy flips the wheel's boxes over between the sections and his
  // actions (App.css, .wheel.is-flipped); for now, clicking him again is the
  // way back.
  function toggleMenu() {
    if (blocked) return
    setMenu((m) => (m === 'sections' ? 'pet' : 'sections'))
    setTucked(false)
  }

  // Choose the box at place i: open its section, or do the action on its back.
  function choose(i: number) {
    if (menu === 'sections') void goTo(WHEEL[i])
    else void run(PET_WHEEL[i])
  }

  // Back to the main screen, with every wheel option showing again.
  async function back() {
    if (!panelOpen && menu === 'pet') return toggleMenu()
    if (!panelOpen || flying) return
    // Reverse slide: the title drops back down into the wheel's selected box
    // while the page fades out and the pet flies home.
    const item = section && itemRefs.current[section]
    const title = screenRef.current?.querySelector<HTMLElement>('.lcd-page.is-open .page-title')
    const slide = item && title ? slideBox(item, title, false) : Promise.resolve()
    setPanelOpen(false)
    setTucked(false)
    await Promise.all([flyTo(0, 0), slide])
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
    items[next].scrollIntoView({ block: 'nearest' }) // long Shows lists scroll
  }

  // A page opens with its bottom-most item highlighted, so select works
  // straight away. Re-runs when show dates arrive, since the list changes then.
  useEffect(() => {
    const page = panelOpen && screenRef.current?.querySelector('.lcd-page.is-open')
    if (!page) return
    const items = pageItems(page)
    items.forEach((el) => el.removeAttribute('data-hl'))
    const last = items.at(-1)
    last?.setAttribute('data-hl', '')
    last?.scrollIntoView({ block: 'nearest' }) // only moves a long Shows list
  }, [panelOpen, section, shows.status, shows.shows.length])

  // Device buttons (and, later, pet actions) come in here.
  const nav = (item: Nav) => {
    const page = screenRef.current?.querySelector('.lcd-page.is-open')
    if (item === 'left' || item === 'right') {
      const dir = item === 'right' ? 1 : -1
      if (page) stepPage(page, dir)
      else if (!blocked) spin(dir)
    } else if (item === 'select') {
      if (page) pageItems(page).find((el) => el.hasAttribute('data-hl'))?.click()
      else if (!blocked) choose(mod4(-turnRef.current))
    } else if (item === 'back') void back()
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
      <ul
        className={`wheel${tucked ? ' is-tucked' : ''}${menu === 'pet' ? ' is-flipped' : ''}`}
        aria-label={menu === 'sections' ? 'Sections' : "Buddy's actions"}
      >
        {WHEEL.map((key, i) => {
          const at = mod4(i + turn) // 0 bottom, 1 left, 2 top, 3 right
          // Around the center at 90deg + (i + turn) * 90deg, then turned back so
          // the label stays upright. Plain values, no CSS variables: Safari
          // doesn't animate transforms whose change comes from a variable.
          const angle = 90 + (i + turn) * 90
          const radius = at === 0 ? WHEEL_R_CURRENT : tucked ? WHEEL_R_TUCKED : WHEEL_R
          return (
            <li
              key={key}
              className={`wheel-slot${at === 0 ? ' is-current' : ''}`}
              style={{ transform: `rotate(${angle}deg) translateX(${radius}cqh) rotate(${-angle}deg)` }}
              onMouseEnter={() => setHold(true)}
              onMouseLeave={() => setHold(false)}
            >
              {at === 0 && (
                <button
                  type="button"
                  className="wheel-arrow wheel-arrow-left"
                  aria-label="Previous"
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
                // Clicking the highlighted item chooses it; any other spins it down.
                onClick={() => (at === 0 ? choose(i) : spin(at === 3 ? 1 : -at))}
              >
                {/* Two sides of one card: the section, and buddy's action on the back. */}
                <span className="wheel-face" aria-hidden={menu === 'pet'}>
                  {SECTIONS[key].title}
                </span>
                <span className="wheel-face wheel-back" aria-hidden={menu === 'sections'}>
                  {PET_LABELS[PET_WHEEL[i]]}
                </span>
              </button>
              {at === 0 && (
                <button
                  type="button"
                  className="wheel-arrow wheel-arrow-right"
                  aria-label="Next"
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
            aria-label="Show all options"
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
        disabled={blocked}
        selected={menu === 'pet'}
        onClick={toggleMenu}
      />

      {section && (
        <div className={`lcd-page section${panelOpen ? ' is-open' : ''}`}>
          <button type="button" className="back-btn" onClick={() => void back()}>
            &lt; back
          </button>
          <h2 className="page-title">{SECTIONS[section].title}</h2>
          {SECTIONS[section].body && <p className="page-body">{SECTIONS[section].body}</p>}
          <ul className="page-links">
            {section === 'shows' ? (
              <>
                {shows.status === 'loading' && <li className="panel-status">Loading dates...</li>}
                {shows.status === 'error' && (
                  <li>
                    <a href={BANDSINTOWN_URL} {...external(BANDSINTOWN_URL)} style={{ '--len': 20 } as React.CSSProperties}>
                      Dates on Bandsintown
                    </a>
                  </li>
                )}
                {shows.status === 'ready' && shows.shows.length === 0 && <li className="panel-status">No shows booked -- check back soon.</li>}
                {shows.shows.map((s) => (
                  <li key={s.id}>
                    <a className="show-link" href={s.url} {...external(s.url)}>
                      <span className="show-date">{s.date}</span>
                      <span className="show-place">{s.place}</span>
                    </a>
                  </li>
                ))}
              </>
            ) : (
              SECTIONS[section].links.map((l) => (
                <li key={l.label}>
                  {/* --len lets long labels (the email) shrink to fit the width. */}
                  <a href={l.href} {...external(l.href)} style={{ '--len': l.label.length } as React.CSSProperties}>
                    {l.label}
                  </a>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

