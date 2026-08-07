import type { Trip } from '../types'

// Emoji per stop kind, falling back to a dot for anything unmapped.
const KIND_ICON: Record<string, string> = {
  fuel: '⛽',
  break: '☕',
  pickup: '📦',
  dropoff: '🏁',
  sleeper: '😴',
  restart: '🔄',
}

// Vertical list of every planned stop (time, location, cumulative mile).
export default function StopsTimeline({ trip }: { trip: Trip }) {
  return (
    <ul className="stop-list">
      {trip.stops.map((s, i) => (
        <li key={`${s.kind}-${i}`} className={`stop-item stop-item--${s.kind}`}>
          <span className="stop-icon">{KIND_ICON[s.kind] ?? '•'}</span>
          <div className="stop-main">
            <span className="stop-label">{s.label}</span>
            <span className="stop-sub">
              {s.location} · mile {s.cumMiles}
            </span>
          </div>
          <span className="stop-time">{s.time}</span>
        </li>
      ))}
    </ul>
  )
}
