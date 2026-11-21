import { useState, type CSSProperties } from 'react'
import Screen from './Screen'
import { ACTION_STAT, MENU, randomStats, STAT_DROP, type Action, type MenuItem } from './content'
import logo from './assets/bird-logo.svg'

// 4-tone LCD palette (darkest -> lightest), applied to the screen as an SVG
// filter: luminance first, then posterized into olive-grey tones.
const LCD_R = '0.149 0.333 0.576 0.784'
const LCD_G = '0.188 0.400 0.647 0.831'
const LCD_B = '0.122 0.247 0.420 0.627'

// Sparkles and gold pieces that fly out from the center of the device (see
// .deco in App.css). s = size (cqw), t = seconds per flight, c = sparkle colour.
// Start angles and offsets are random once per page load; each piece gets a
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
const DECOR = PIECES.map((d) => ({ ...d, delay: -rand(0, d.t), angle: randomAngle() }))

// Intro shell pieces, in the clockwise order they snap in (timing in App.css).
const PIECES_IN = ['top', 'right', 'bottom', 'left'] as const

// Three buttons like the real toy: A cycles the menu, B confirms, C cancels.
export default function App() {
  const [stats, setStats] = useState(randomStats)
  // One-time intro on load (all CSS-timed); skipped for reduced motion.
  const [intro, setIntro] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [selected, setSelected] = useState<number | null>(null)
  const [command, setCommand] = useState<{ item: MenuItem | 'back'; n: number } | null>(null)
  const send = (item: MenuItem | 'back') => setCommand((c) => ({ item, n: (c?.n ?? 0) + 1 }))

  function onAction(a: Action) {
    const key = ACTION_STAT[a]
    setStats((s) => ({ ...s, [key]: Math.max(0, s[key] - STAT_DROP) }))
  }

  const buttons = [
    { id: 'a', label: 'Next menu item', press: () => setSelected((s) => (s === null ? 0 : (s + 1) % MENU.length)) },
    { id: 'b', label: 'Select', press: () => selected !== null && send(MENU[selected].item) },
    {
      id: 'c',
      label: 'Cancel',
      press: () => {
        setSelected(null)
        send('back')
      },
    },
  ]

  return (
    <main className="stage">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <filter id="lcd-palette" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues={LCD_R} />
            <feFuncG type="discrete" tableValues={LCD_G} />
            <feFuncB type="discrete" tableValues={LCD_B} />
          </feComponentTransfer>
        </filter>
      </svg>
      <div className={`device${intro ? ' is-intro' : ''}`}>
        <div className="shell" aria-hidden="true" />
        <div className="sky" aria-hidden="true">
          {DECOR.map(({ kind, s, t, c, delay, angle }, i) => (
            <i
              key={i}
              className={`deco deco-${kind}`}
              style={{ '--s': `${s}cqw`, '--t': `${t}s`, '--d': `${delay}s`, '--a': angle, '--c': c } as CSSProperties}
              onAnimationIteration={(e) => e.currentTarget.style.setProperty('--a', randomAngle())}
            />
          ))}
        </div>
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
          <Screen stats={stats} selected={selected} command={command} onAction={onAction} />
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
