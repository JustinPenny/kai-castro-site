export type StatKey = 'hunger' | 'fullness' | 'energy' | 'boredom'
export type Stats = Record<StatKey, number>

// Order the bars appear on the status page, top to bottom.
export const STAT_ORDER: { key: StatKey; label: string }[] = [
  { key: 'hunger', label: 'Hunger' },
  { key: 'fullness', label: 'Fullness' },
  { key: 'energy', label: 'Energy' },
  { key: 'boredom', label: 'Boredom' },
]

// Each device button lowers its stat by this many points (of 100).
export const STAT_DROP = 25

export type DeviceAction = 'feed' | 'bathroom' | 'sleep' | 'play'

export const ACTION_STAT: Record<DeviceAction, StatKey> = {
  feed: 'hunger',
  bathroom: 'fullness',
  sleep: 'energy',
  play: 'boredom',
}

const randomValue = () => Math.floor(Math.random() * 101)

// Fresh random 0-100 values; called once when the page loads.
export function randomStats(): Stats {
  return {
    hunger: randomValue(),
    fullness: randomValue(),
    energy: randomValue(),
    boredom: randomValue(),
  }
}
