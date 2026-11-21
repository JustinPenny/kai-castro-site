// PLACEHOLDER ART: a plain CSS blob that shows its pose name (App.css,
// "Buddy"). Idle bob/blink/caw and the flap are CSS animations; Screen.tsx
// sets the action poses (eat, potty, sleep, play). To add real frames, give
// each [data-pose] a background image in App.css.
export default function Buddy({
  pose,
  flying,
  x,
  y,
  facingLeft,
  durationMs,
  disabled,
  onClick,
}: {
  pose: string | null // an action pose, or null for idle/flap
  flying: boolean
  x: number
  y: number
  facingLeft: boolean
  durationMs: number
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`buddy${facingLeft ? ' is-left' : ''}`}
      data-pose={pose ?? (flying ? 'flap' : 'idle')}
      aria-label="Status"
      disabled={disabled}
      onClick={onClick}
      style={{
        translate: `calc(-50% + ${x}px) calc(-50% + ${y}px)`,
        transition: `translate ${durationMs}ms steps(8, end)`,
      }}
    >
      <span className="buddy-body" />
    </button>
  )
}
