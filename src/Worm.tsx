import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import worm1 from './assets/worm_1.webp'
import worm2 from './assets/worm_2.webp'
import worm3 from './assets/worm_3.webp'
import worm4 from './assets/worm_4.webp'
import worm5 from './assets/worm_5.webp'
import worm6 from './assets/worm_6.webp'
import worm7 from './assets/worm_7.webp'
import worm8 from './assets/worm_8.webp'

// Frames 1-6 play once as the worm rises out of the ground; the last two
// (7-8) then loop back and forth as its "settled, waiting" pose until it
// gets eaten -- no more timing out and retreating on its own.
const FRAMES = [worm1, worm2, worm3, worm4, worm5, worm6, worm7, worm8]
const LAST_RISE_FRAME = FRAMES.length - 2 // index 6 -- first idle frame
const RISE_FRAME_MS = 90
const IDLE_FRAME_MS = 350
const RESPAWN_DELAY_MS = 7000
const EATEN_FADE_MS = 150
// How long it can sit there un-clicked before the "eat me!" nudge shows up.
const PROMPT_DELAY_MS = 5000

// Half-width of the column straight up the middle (stump + grown bird +
// the wordmark sitting right above it) that a worm must spawn outside of,
// plus how much clearance to keep from every other element on screen
// (corner boxes, corner art, grass) -- see pickSpawnPoint. The wordmark
// sits close above the bird by design, so there's very little *vertical*
// gap near center -- the real open space is the wide strips to either
// side of the stump, not a ring all the way around it.
const CENTER_COLUMN_HALF_WIDTH = 100
const EDGE_MARGIN = 16
// Half the rendered worm's width, and its full height (see `.worm` in
// Landing.css) -- kept clear of every box/page edge so the sprite itself
// never pokes outside the safe area (or the page) it was placed in.
const WORM_HALF_WIDTH = 28
const WORM_HEIGHT = 56

const AVOID_SELECTORS = [
  '.wordmark-wrap',
  '.corner-booking',
  '.corner-shows',
  '.corner-streams',
  '.corner-socials',
  '.tree-shows',
  '.lamp-booking',
  '.headphones-corner',
  '.hand-corner',
  '.grass-strip',
]

interface SpawnPoint {
  x: number
  y: number
}

// Finds a random point in the open white space beside the stump: inside a
// box shrunk in from whichever element edges border it (same "push the
// safe zone in from whichever side it's on" approach as SkyDecor's
// useSafeZone), and outside the center column occupied by the stump/bird/
// wordmark.
//
// Everything is measured, and the result returned, in coordinates relative
// to `.landing`'s own box (not the window) -- that's what `.worm`'s
// `left`/`top` need, since it's positioned absolutely inside `.landing`,
// and it keeps this correct even if `.landing` isn't flush with the
// window's top-left corner for any reason. Using `.landing`'s own
// measured width/height here (rather than window.innerWidth/innerHeight)
// also avoids the mismatches those can have with what's actually
// rendered (mobile browser chrome affecting svh, scrollbar gutters, etc).
//
// `relaxed` shrinks the margins for a second-chance attempt on cramped
// viewports where the strict pass finds no room at all -- better to place
// a worm a little closer to something than to just not show one.
function pickSpawnPoint(relaxed = false): SpawnPoint | null {
  const landingEl = document.querySelector<HTMLElement>('.landing')
  if (!landingEl) return null
  const container = landingEl.getBoundingClientRect()
  const vw = container.width
  const vh = container.height
  const centerX = vw / 2
  const centerY = vh / 2

  const edgeMargin = relaxed ? EDGE_MARGIN / 2 : EDGE_MARGIN
  const centerHalfWidth = relaxed ? CENTER_COLUMN_HALF_WIDTH / 2 : CENTER_COLUMN_HALF_WIDTH

  let boxLeft = 0
  let boxRight = vw
  let boxTop = 0
  let boxBottom = vh

  for (const selector of AVOID_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector)
    if (!el) continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) continue
    const left = r.left - container.left
    const right = r.right - container.left
    const top = r.top - container.top
    const bottom = r.bottom - container.top
    const elCenterX = (left + right) / 2
    const elCenterY = (top + bottom) / 2
    if (Math.abs(elCenterX - centerX) > Math.abs(elCenterY - centerY)) {
      if (elCenterX < centerX) boxLeft = Math.max(boxLeft, right + edgeMargin)
      else boxRight = Math.min(boxRight, left - edgeMargin)
    } else {
      if (elCenterY < centerY) boxTop = Math.max(boxTop, bottom + edgeMargin)
      else boxBottom = Math.min(boxBottom, top - edgeMargin)
    }
  }

  const yLo = boxTop + WORM_HEIGHT
  const yHi = boxBottom
  if (yLo >= yHi) return null

  const leftStripHi = centerX - centerHalfWidth - WORM_HALF_WIDTH
  const rightStripLo = centerX + centerHalfWidth + WORM_HALF_WIDTH
  const leftStripLo = boxLeft + WORM_HALF_WIDTH
  const rightStripHi = boxRight - WORM_HALF_WIDTH

  const strips: [number, number][] = []
  if (leftStripHi > leftStripLo) strips.push([leftStripLo, leftStripHi])
  if (rightStripHi > rightStripLo) strips.push([rightStripLo, rightStripHi])
  if (strips.length === 0) return null

  const [xLo, xHi] = strips[Math.floor(Math.random() * strips.length)]
  const x = xLo + Math.random() * (xHi - xLo)
  const y = yLo + Math.random() * (yHi - yLo)

  // Belt-and-suspenders: whatever the box math above worked out to, never
  // hand back a point (or the worm's own footprint around it) that falls
  // outside the actual page bounds.
  return {
    x: Math.min(Math.max(x, WORM_HALF_WIDTH), vw - WORM_HALF_WIDTH),
    y: Math.min(Math.max(y, WORM_HEIGHT), vh),
  }
}

export interface WormHandle {
  // Bird has arrived at the worm's spot -- fade it out now and count it as
  // eaten. No-ops if there's no click currently pending (e.g. the flight
  // got redirected elsewhere -- see cancelPending).
  triggerEaten: () => void
  // The flight toward the worm got interrupted/redirected before arriving
  // -- put it back into its normal clickable state instead of leaving it
  // stuck waiting forever.
  cancelPending: () => void
}

interface WormProps {
  // Fires the moment the worm is clicked, with its on-screen (window,
  // not `.landing`-relative) position, so Landing.tsx can fly the bird
  // there. Growth/the "+1" only happen once Landing calls triggerEaten.
  onWormClick: (point: SpawnPoint) => void
}

const Worm = forwardRef<WormHandle, WormProps>(function Worm({ onWormClick }, ref) {
  const [spawn, setSpawn] = useState<SpawnPoint | null>(null)
  const [frame, setFrame] = useState(0)
  const [pending, setPending] = useState(false)
  const [eaten, setEaten] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  const respawnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const frameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const promptTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleSpawn(delay: number) {
    respawnTimer.current = setTimeout(() => {
      const point = pickSpawnPoint() ?? pickSpawnPoint(true)
      if (!point) {
        // No clean room right now, even relaxed -- try again shortly
        // rather than overlapping something.
        scheduleSpawn(1000)
        return
      }
      setSpawn(point)
      setFrame(0)
      setPending(false)
      setEaten(false)
      setShowPrompt(false)
      if (promptTimer.current) clearTimeout(promptTimer.current)
      promptTimer.current = setTimeout(() => setShowPrompt(true), PROMPT_DELAY_MS)
    }, delay)
  }

  useEffect(() => {
    scheduleSpawn(RESPAWN_DELAY_MS)
    return () => {
      if (respawnTimer.current) clearTimeout(respawnTimer.current)
      if (frameTimer.current) clearTimeout(frameTimer.current)
      if (fadeTimer.current) clearTimeout(fadeTimer.current)
      if (promptTimer.current) clearTimeout(promptTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!spawn || eaten) return
    const delay = frame < LAST_RISE_FRAME ? RISE_FRAME_MS : IDLE_FRAME_MS
    frameTimer.current = setTimeout(() => {
      setFrame((f) => {
        if (f < LAST_RISE_FRAME) return f + 1
        return f === LAST_RISE_FRAME ? FRAMES.length - 1 : LAST_RISE_FRAME
      })
    }, delay)
    return () => {
      if (frameTimer.current) clearTimeout(frameTimer.current)
    }
  }, [spawn, eaten, frame])

  useImperativeHandle(ref, () => ({
    triggerEaten() {
      if (!pending || eaten) return
      setEaten(true)
      setShowPrompt(false)
      if (promptTimer.current) clearTimeout(promptTimer.current)
      fadeTimer.current = setTimeout(() => setSpawn(null), EATEN_FADE_MS)
      scheduleSpawn(RESPAWN_DELAY_MS)
    },
    cancelPending() {
      setPending(false)
      // Back to being ignorable -- restart the "eat me!" countdown.
      if (promptTimer.current) clearTimeout(promptTimer.current)
      promptTimer.current = setTimeout(() => setShowPrompt(true), PROMPT_DELAY_MS)
    },
  }))

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    // This button sits directly inside `.landing`, which has its own
    // onClick driving normal background-click flights -- without this,
    // that handler fires right after this one (on the same click, via
    // bubbling) and immediately cancels the flight just started below.
    e.stopPropagation()
    if (!spawn || pending || eaten) return
    setPending(true)
    setShowPrompt(false)
    if (promptTimer.current) clearTimeout(promptTimer.current)
    // Report position in window coordinates (what Landing's flight system
    // works in), converting from the `.landing`-relative point this
    // component positions itself with.
    const landingEl = document.querySelector<HTMLElement>('.landing')
    const container = landingEl?.getBoundingClientRect()
    onWormClick(container ? { x: spawn.x + container.left, y: spawn.y + container.top } : spawn)
  }

  if (!spawn) return null

  return (
    <button
      type="button"
      className={eaten ? 'worm worm-eaten' : 'worm'}
      style={{ left: spawn.x, top: spawn.y }}
      onClick={handleClick}
      aria-label="worm"
    >
      {showPrompt && (
        <span className="worm-prompt" aria-hidden="true">
          eat me!
        </span>
      )}
      <img className="worm-frame" src={FRAMES[frame]} alt="" />
    </button>
  )
})

export default Worm
