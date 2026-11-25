import { memo, useRef, useState, type CSSProperties } from 'react'
import Screen, { type Nav } from './Screen'
import { ACTION_STAT, randomStats, STAT_DROP, type Action } from './content'
import logo from './assets/bird-logo.svg'

// Sparkles and gold pieces that fly out from the center of the device (see
// .deco in App.css). s = size (cqw), t = seconds per flight, c = sparkle colour.
// Start angles are random once per page load; each piece gets a
// new random angle every time it loops (onAnimationIteration below).
type Deco = { kind: 'sparkle' | 'star' | 'moon' | 'stripes' | 'dot'; s: number; t: number; c?: string }
const SPARKLE_COLORS = ['#fff', '#fff', '#8fe0ff', '#ffb6f0']
const rand = (min: number, max: number) => min + Math.random() * (max - min)
const randomAngle = () => `${Math.floor(Math.random() * 360)}deg`
const PIECES: Deco[] = [
  ...Array.from({ length: 70 }, (_, i) => ({ kind: 'sparkle' as const, s: rand(0.3, 0.8), t: rand(14, 24), c: SPARKLE_COLORS[i % 4] })),
  { kind: 'moon', s: 15, t: 26 },
  ...Array.from({ length: 5 }, () => ({ kind: 'star' as const, s: rand(2.6, 6), t: rand(15, 22) })),
  ...Array.from({ length: 5 }, () => ({ kind: 'stripes' as const, s: rand(9, 11), t: rand(11, 15) })),
  ...Array.from({ length: 8 }, () => ({ kind: 'dot' as const, s: rand(0.8, 1.2), t: rand(17, 23) })),
]
// No per-piece start delay: in Chrome, differing start times make every flight
// need main-thread frames (~6% CPU idle); with one start time they run fully on
// the GPU, and the different speeds spread them out within seconds.
const DECOR = PIECES.map((d) => ({ ...d, angle: randomAngle() }))

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

// The drifting sky never changes after mount, so it's memoised: button presses
// re-render App but not these ~80 elements.
const Sky = memo(function Sky() {
  return (
    <div className="sky" aria-hidden="true">
      {DECOR.map(({ kind, s, t, c, angle }, i) => (
        <i
          key={i}
          className={`deco deco-${kind}`}
          style={{ '--s': `${s}cqw`, '--t': `${t}s`, '--a': angle, '--c': c } as CSSProperties}
          onAnimationIteration={(e) => e.currentTarget.style.setProperty('--a', randomAngle())}
        />
      ))}
    </div>
  )
})

// Intro shell pieces, in the clockwise order they snap in (timing in App.css).
const PIECES_IN = ['top', 'right', 'bottom', 'left'] as const

// Three buttons: left / right spin the section wheel (or move the highlight on
// an open page), the middle one selects. Screen.tsx does the work.
export default function App() {
  const [stats, setStats] = useState(randomStats)
  // Intro (all CSS-timed); see shouldPlayIntro for when it runs.
  const [intro, setIntro] = useState(PLAY_INTRO)
  const nav = useRef<((item: Nav) => void) | null>(null)
  const send = (item: Nav) => nav.current?.(item)

  function onAction(a: Action) {
    const key = ACTION_STAT[a]
    setStats((s) => ({ ...s, [key]: Math.max(0, s[key] - STAT_DROP) }))
  }

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
          <p className="brand-tag">dj / producer</p>
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
                <div className="brand-tag">dj / producer</div>
              </div>
              {buttons.map((b) => (
                <span key={b.id} className={`hw-button hw-${b.id}`} />
              ))}
            </div>
          ))}
        <div className="screen">
          <Screen stats={stats} navRef={nav} ready={!intro} onAction={onAction} />
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
