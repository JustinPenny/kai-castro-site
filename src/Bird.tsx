import { useEffect, useRef, useState } from 'react'
import buddyIdle from './assets/buddy_idle.webp'
import buddyDown from './assets/buddy_idle_down.webp'
import buddyBlink from './assets/buddy_idle_blink.webp'
import buddyBeak from './assets/buddy_beak.webp'
import buddyFlap from './assets/buddy_flap.webp'
import buddyEat1 from './assets/buddy_eat_1.webp'
import buddyEat2 from './assets/buddy_eat_2.webp'

// On-screen size of the buddy at growth 1 (the art is 128x128 pixels).
const SIZE = 160

// Idle: a slow two-pose bob (up, down). One "bob" = one up pose plus one
// down pose. The up pose is swapped for a blink on every 4th bob and for
// an open beak (a caw) on every 10th; the beak wins on bobs that are both.
const BOB_POSE_MS = 650
const BLINK_EVERY = 4
const CAW_EVERY = 10
// Moving: alternate the flap pose with the idle-up pose.
const FLAP_FRAME_MS = 140

interface BirdProps {
  flying: boolean
  offsetX: number
  offsetY: number
  durationMs: number
  // 0 = not eating; 1 / 2 = which eat pose to show.
  eatFrame?: 0 | 1 | 2
}

export default function Bird({
  flying,
  offsetX,
  offsetY,
  durationMs,
  eatFrame = 0,
}: BirdProps) {
  const [facingLeft, setFacingLeft] = useState(false)
  // Counts bob poses (even = up, odd = down); only advances while idle, so
  // the blink/caw cadence picks up where it left off after a flight.
  const [bobTick, setBobTick] = useState(0)
  const [flapUp, setFlapUp] = useState(true)
  const prevOffsetX = useRef(offsetX)

  useEffect(() => {
    if (flying) return
    const id = setInterval(() => setBobTick((t) => t + 1), BOB_POSE_MS)
    return () => clearInterval(id)
  }, [flying])

  useEffect(() => {
    if (!flying) return
    setFlapUp(true)
    const id = setInterval(() => setFlapUp((f) => !f), FLAP_FRAME_MS)
    return () => clearInterval(id)
  }, [flying])

  // Face the direction of travel: a new target to the left of where the
  // bird currently is means it's flying left, so mirror the (right-facing) art.
  useEffect(() => {
    const dx = offsetX - prevOffsetX.current
    if (dx < -2) setFacingLeft(true)
    else if (dx > 2) setFacingLeft(false)
    prevOffsetX.current = offsetX
  }, [offsetX])

  const bobNumber = Math.floor(bobTick / 2) + 1 // 1-based
  const isDown = bobTick % 2 === 1
  let src = buddyIdle
  if (eatFrame) {
    src = eatFrame === 1 ? buddyEat1 : buddyEat2
  } else if (flying) {
    src = flapUp ? buddyFlap : buddyIdle
  } else if (isDown) {
    src = buddyDown
  } else if (bobNumber % CAW_EVERY === 0) {
    src = buddyBeak
  } else if (bobNumber % BLINK_EVERY === 0) {
    src = buddyBlink
  }


  // `translate` animates the flight; `scale` is a separate CSS property
  // with no transition, so the left/right mirror snaps instantly.
  //
  // Handheld-LCD feel: every transition is `steps()` instead of an eased
  // curve, so the bird hops between a handful of discrete positions/sizes
  // (like a low-framerate sprite) rather than gliding smoothly.
  return (
    <img
      className="bird"
      src={src}
      width={SIZE}
      height={SIZE}
      style={{
        width: SIZE,
        height: SIZE,
        translate: `calc(-50% + ${offsetX}px) calc(-50% + ${offsetY}px)`,
        scale: facingLeft ? '-1 1' : '1 1',
        transition: `translate ${durationMs}ms steps(8, end)`,
      }}
      alt=""
      aria-hidden="true"
    />
  )
}
