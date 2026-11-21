import { useState } from 'react'
import Screen from './Screen'
import { ACTION_STAT, MENU, randomStats, STAT_DROP, type Action, type MenuItem } from './content'
import shell from './assets/shell.svg'

// 4-tone LCD palette (darkest -> lightest), applied to the screen as an SVG
// filter: luminance first, then posterized into olive-grey tones.
const LCD_R = '0.149 0.333 0.576 0.784'
const LCD_G = '0.188 0.400 0.647 0.831'
const LCD_B = '0.122 0.247 0.420 0.627'

// Three buttons like the real toy: A cycles the menu, B confirms, C cancels.
export default function App() {
  const [stats, setStats] = useState(randomStats)
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
      <div className="device">
        <img className="shell" src={shell} alt="" />
        <header className="brand">
          <h1>Kai Castro</h1>
          <p>dj / producer</p>
        </header>
        <div className="screen">
          <Screen stats={stats} selected={selected} command={command} onAction={onAction} />
          <div className="lcd-glass" aria-hidden="true" />
        </div>
        {buttons.map((b) => (
          <button key={b.id} type="button" className={`hw-button hw-${b.id}`} aria-label={b.label} onClick={b.press} />
        ))}
      </div>
    </main>
  )
}
