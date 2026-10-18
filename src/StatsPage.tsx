import buddyIdle from './assets/buddy_idle.webp'
import { STAT_ORDER, type Stats } from './stats'
import './StatsPage.css'

const BUDDY_NAME = 'Buddy'
const BUDDY_LEVEL = 1

// Pokedex-style entry: buddy on the left (name above, level below), stat
// bars on the right.
export default function StatsPage({ stats, onClose }: { stats: Stats; onClose: () => void }) {
  return (
    <div className="stats-page">
      <button type="button" className="back-btn stats-back" onClick={onClose}>
        &lt; back
      </button>
      <h1 className="stats-title">Status</h1>
      <div className="stats-body">
        <div className="stats-buddy">
          <h1 className="stats-name">{BUDDY_NAME}</h1>
          <img className="stats-sprite" src={buddyIdle} alt="" aria-hidden="true" />
          <p className="stats-level">Lv. {BUDDY_LEVEL}</p>
        </div>
        <ul className="stats-list">
          {STAT_ORDER.map(({ key, label }) => (
            <li key={key} className="stat-row">
              <span className="stat-label">{label}</span>
              <div
                className="stat-bar"
                role="progressbar"
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={stats[key]}
              >
                <div className="stat-fill" style={{ width: `${stats[key]}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
