// Buddy, the pixel-art bird. The sprite sheet and the idle / flap animations
// live in App.css ("Buddy"); this sets the pose: an action pose from Screen.tsx (eat,
// potty, sleep, play), otherwise flap while flying or idle.
export default function Buddy({
  pose,
  flying,
  x,
  y,
  facingLeft,
  durationMs,
  disabled,
  selected,
  onClick,
}: {
  pose: string | null // an action pose, or null for idle/flap
  flying: boolean
  x: number
  y: number
  facingLeft: boolean
  durationMs: number
  disabled: boolean
  selected: boolean // his wheel is showing: viewfinder brackets on him
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`buddy${facingLeft ? ' is-left' : ''}`}
      data-pose={pose ?? (flying ? 'flap' : 'idle')}
      aria-label={selected ? 'Back to sections' : "Buddy's actions"}
      aria-pressed={selected}
      data-hl={selected ? '' : undefined}
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
