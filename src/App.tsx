import { useState } from 'react'
import Landing from './Landing'
import './Device.css'
import feedIcon from './assets/food_icon.webp'
import bathroomIcon from './assets/potty_icon.webp'
import sleepIcon from './assets/sleep_icon.webp'
import playIcon from './assets/play_icon.webp'

// Duotone-style 4-tone LCD palette (darkest -> lightest), applied as an
// SVG filter to `.landing` (see Landing.css): everything on screen is
// collapsed to luminance, then posterized into four olive-gray tones.
// Defined once here so the palette lives in one place.
const LCD_R = '0.149 0.333 0.576 0.784'
const LCD_G = '0.188 0.400 0.647 0.831'
const LCD_B = '0.122 0.247 0.420 0.627'

// Left to right, as printed under the screen.
const DEVICE_BUTTONS = [
  { label: 'Feed', icon: feedIcon },
  { label: 'Bathroom', icon: bathroomIcon },
  { label: 'Sleep', icon: sleepIcon },
  { label: 'Play', icon: playIcon },
]

function App() {
  const [feedTick, setFeedTick] = useState(0)
  const [pottyTick, setPottyTick] = useState(0)
  const [sleepTick, setSleepTick] = useState(0)
  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <filter id="lcd-palette" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0"
          />
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues={LCD_R} />
            <feFuncG type="discrete" tableValues={LCD_G} />
            <feFuncB type="discrete" tableValues={LCD_B} />
          </feComponentTransfer>
        </filter>
      </svg>
      <div className="device-stage">
        <div className="device">
          {/* The shell's printed logo. */}
          <header className="device-brand">
            <p className="wordmark">Kai Castro</p>
            <p className="tagline">dj / producer</p>
          </header>
          <div className="device-bezel">
            <div className="device-screen">
              <Landing feedTick={feedTick} pottyTick={pottyTick} sleepTick={sleepTick} />
              {/* Unfiltered on purpose: the pixel grid and glass shading
                  sit on top of the palette, not inside it. */}
              <div className="lcd-overlay" aria-hidden="true" />
            </div>
          </div>
          <div className="device-buttons">
            {DEVICE_BUTTONS.map(({ label, icon }) => (
              <button key={label} type="button" className="device-button" aria-label={label}
                onClick={
                  label === 'Feed'
                    ? () => setFeedTick((t) => t + 1)
                    : label === 'Bathroom'
                      ? () => setPottyTick((t) => t + 1)
                      : label === 'Sleep'
                        ? () => setSleepTick((t) => t + 1)
                        : undefined
                }
              >
                <span className="device-button-cap">
                  <img className="device-button-icon" src={icon} alt="" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
