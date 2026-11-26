import { memo, useEffect, useRef, useState, type CSSProperties } from 'react'
import Screen, { type Nav } from './Screen'
import logo from './assets/bird-logo.svg'

// The sky is a tunnel (see .sky / .deco in App.css): an egg-shaped corridor,
// the same shape as the shell, running back to a vanishing point behind the
// screen. Gold pieces and music symbols lie flat on its wall and ride along
// it toward the viewer; sparkles fill the space inside it.
// s = size (cqw), t = seconds per flight, c = sparkle colour. Each piece gets
// a new random spot every time its animation loops (every four flights, see
// @keyframes fly; onAnimationIteration below), except the dashes, dots,
// lines and waveforms, which keep theirs like road markings.
type Music = 'quarter' | 'eighth' | 'beamed' | 'half' | 'sharp' | 'flat' | 'clef' | 'whole' | 'sixteenth' | 'natural' | 'rest' | 'bass'
type Kind = 'sparkle' | 'star' | 'moon' | 'dash' | 'dot' | 'wave' | 'line' | 'swirl' | Music
const MUSIC: Music[] = ['quarter', 'eighth', 'beamed', 'half', 'sharp', 'flat', 'clef', 'whole', 'sixteenth', 'natural', 'rest', 'bass']
// Everything riding the wall lies flat against it; only sparkles float free.
const FLAT = new Set<Kind>(['star', 'moon', 'dash', 'dot', 'wave', 'line', 'swirl', ...MUSIC])
type Deco = { kind: Kind; s: number; t: number; c?: string }
// Each piece (bar sparkles, which have their own colours) gets one of these at random.
const FILLS = ['gold', 'black', 'white'].map((f) => `var(--${f}-fill)`)
const SPARKLE_COLORS = ['#fff', '#fff', '#8fe0ff', '#ffb6f0']
const rand = (min: number, max: number) => min + Math.random() * (max - min)
// The corridor's cross-section, in cqw from the vanishing point: half-width,
// and height above and below (the egg is fuller at the top, like the shell).
const TUBE_W = 22
const TUBE_TOP = 31
const TUBE_BOTTOM = 22.4
// The point on the wall at angle a (radians, clockwise from the right).
const wall = (a: number) => [TUBE_W * Math.cos(a), (Math.sin(a) < 0 ? TUBE_TOP : TUBE_BOTTOM) * Math.sin(a)]
// A flat piece lies against the wall: tipped back 90deg (so its own y axis
// runs along the corridor, see fly-flat), then turned about the corridor's
// axis to face the wall's normal there. As one rotation, for CSS's rotate
// (axis and angle of the quaternion rotateZ(phi) * rotateX(90deg)).
const lieOnWall = (a: number) => {
  const phi = Math.atan2(-Math.cos(a) / TUBE_W, Math.sin(a) / (Math.sin(a) < 0 ? TUBE_TOP : TUBE_BOTTOM))
  const c = Math.cos(phi / 2) * Math.SQRT1_2
  const v = [c, Math.sin(phi / 2) * Math.SQRT1_2, Math.sin(phi / 2) * Math.SQRT1_2]
  const n = Math.hypot(...v)
  return `${v.map((k) => (k / n).toFixed(4)).join(' ')} ${2 * Math.acos(c)}rad`
}
// Where a piece flies (its centre on that spot; - 50% centres it).
const at = (x: number, y: number) => `calc(${x.toFixed(1)}cqw - 50%) calc(${y.toFixed(1)}cqw - 50%)`
const lane = (kind: Kind): CSSProperties => {
  // The moon keeps to the upper wall.
  const a = kind === 'moon' ? rand(-2.6, -0.5) : rand(0, 2 * Math.PI)
  const [x, y] = wall(a)
  if (kind === 'sparkle') {
    const r = rand(0.25, 1)
    return { translate: at(x * r, y * r) }
  }
  return FLAT.has(kind) ? { translate: at(x, y), rotate: lieOnWall(a) } : { translate: at(x, y) }
}
const PIECES: Deco[] = [
  ...Array.from({ length: 40 }, (_, i) => ({ kind: 'sparkle' as const, s: rand(0.4, 0.9), t: rand(14, 22), c: SPARKLE_COLORS[i % 4] })),
  { kind: 'moon', s: 5, t: 29 },
  ...Array.from({ length: 5 }, () => ({ kind: 'star' as const, s: rand(1.6, 2.8), t: rand(14, 20) })),
  ...Array.from({ length: 16 }, () => ({ kind: 'dash' as const, s: rand(1.4, 2.2), t: rand(9.5, 13) })),
  ...Array.from({ length: 10 }, () => ({ kind: 'dot' as const, s: rand(1, 1.6), t: rand(11, 16.5) })),
  ...Array.from({ length: 6 }, () => ({ kind: 'wave' as const, s: rand(2.2, 3), t: rand(9.5, 13) })),
  ...Array.from({ length: 8 }, () => ({ kind: 'line' as const, s: rand(0.5, 0.8), t: rand(9.5, 13) })),
  ...Array.from({ length: 6 }, () => ({ kind: 'swirl' as const, s: rand(2.5, 3.5), t: rand(9.5, 13) })),
  // Two of each music symbol.
  ...MUSIC.flatMap((kind) => Array.from({ length: 2 }, () => ({ kind, s: rand(2, 3.2), t: rand(14, 20) }))),
]
// No per-piece start delay: in Chrome, differing start times make every flight
// need main-thread frames (~6% CPU idle); with one start time they run fully on
// the GPU, and the different speeds spread them out within seconds.
// Every piece also gets a random size (0.6 to 1.5 times its kind's) and colour.
const DECOR = PIECES.map((d) => ({
  ...d,
  s: d.s * rand(0.6, 1.5),
  fill: d.kind === 'sparkle' ? undefined : FILLS[Math.floor(Math.random() * FILLS.length)],
  place: lane(d.kind),
}))
const RELANE = new Set<Kind>(['sparkle', 'star', 'moon', ...MUSIC])

// The intro plays on the first load, then not again until INTRO_EVERY_MS has
// passed since it last played (so refreshes skip it). Decided once per page load.
const INTRO_EVERY_MS = 10 * 60 * 1000
const INTRO_KEY = 'kc-intro-played-at'
function shouldPlayIntro() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    const age = Date.now() - Number(localStorage.getItem(INTRO_KEY))
    if (age >= 0 && age < INTRO_EVERY_MS) return false // negative = clock changed: play
    localStorage.setItem(INTRO_KEY, String(Date.now()))
  } catch {
    // Storage blocked (some private modes): just play it.
  }
  return true
}
const PLAY_INTRO = shouldPlayIntro()

// The sky never changes after mount, so it's memoised: button presses
// re-render App but not these ~80 elements.
const Sky = memo(function Sky() {
  return (
    <div className="sky" aria-hidden="true">
      <div className="tunnel">
        {DECOR.map(({ kind, s, t, c, fill, place }, i) => (
          <i
            key={i}
            className={`deco deco-${kind}${FLAT.has(kind) ? ' is-flat' : ''}`}
            style={{ '--s': `${s}cqw`, '--t': `${t}s`, '--c': c, '--fill': fill, ...place } as CSSProperties}
            // A new spot (and, lying flat, the tilt that goes with it).
            onAnimationIteration={RELANE.has(kind) ? (e) => Object.assign(e.currentTarget.style, lane(kind)) : undefined}
          />
        ))}
      </div>
    </div>
  )
})

// Intro shell pieces, in the clockwise order they snap in (timing in App.css).
const PIECES_IN = ['top', 'right', 'bottom', 'left'] as const

// Three buttons: left / right spin the section wheel (or move the highlight on
// an open page), the middle one selects. Screen.tsx does the work.
export default function App() {
  // Intro (all CSS-timed); see shouldPlayIntro for when it runs.
  const [intro, setIntro] = useState(PLAY_INTRO)
  const nav = useRef<((item: Nav) => void) | null>(null)
  const send = (item: Nav) => nav.current?.(item)

  // Arrow keys and sideways swipes work like the left / right buttons. A swipe
  // left brings the next option in (like dragging a carousel).
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
      e.preventDefault()
      nav.current?.(e.key === 'ArrowLeft' ? 'left' : 'right')
    }
    let start: { x: number; y: number } | null = null
    const down = (e: TouchEvent) => {
      start = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null // not pinches
    }
    const up = (e: TouchEvent) => {
      if (!start) return
      const dx = e.changedTouches[0].clientX - start.x
      const dy = e.changedTouches[0].clientY - start.y
      start = null
      if (Math.abs(dx) > 40 && Math.abs(dx) > 1.5 * Math.abs(dy)) nav.current?.(dx < 0 ? 'right' : 'left')
    }
    addEventListener('keydown', key)
    addEventListener('touchstart', down, { passive: true })
    addEventListener('touchend', up)
    return () => {
      removeEventListener('keydown', key)
      removeEventListener('touchstart', down)
      removeEventListener('touchend', up)
    }
  }, [])

  const buttons = [
    { id: 'a', label: 'Previous', press: () => send('left') },
    { id: 'b', label: 'Select', press: () => send('select') },
    { id: 'c', label: 'Next', press: () => send('right') },
  ]

  return (
    <main className="stage">
      <div className={`device${intro ? ' is-intro' : ''}`}>
        <div className="shell" aria-hidden="true" />
        <Sky />
        <div className="bezel" aria-hidden="true" />
        <header className="brand">
          <h1 className="brand-name">Kai Castro</h1>
        </header>
        {/* Intro: four copies of the shell, each clipped to one wedge, fly in
            and land exactly on the real shell, which then replaces them. */}
        {intro &&
          PIECES_IN.map((side) => (
            <div
              key={side}
              className={`piece piece-${side}`}
              aria-hidden="true"
              onAnimationEnd={(e) => side === 'left' && e.target === e.currentTarget && setIntro(false)}
            >
              <div className="shell" />
              <div className="bezel" />
              <div className="brand">
                <div className="brand-name">Kai Castro</div>
              </div>
              {buttons.map((b) => (
                <span key={b.id} className={`hw-button hw-${b.id}`} />
              ))}
            </div>
          ))}
        <div className="screen">
          <Screen navRef={nav} ready={!intro} />
          <div className="lcd-glass" aria-hidden="true" />
        </div>
        {buttons.map((b) => (
          <button key={b.id} type="button" className={`hw-button hw-${b.id}`} aria-label={b.label} onClick={b.press} />
        ))}
        {intro && (
          <div className="intro-blob" aria-hidden="true">
            <img src={logo} alt="" />
          </div>
        )}
      </div>
    </main>
  )
}
