import type { Trip } from '../types'
import { fmtDur } from '../lib/hos'

// Headline stat cards: miles, drive time, days, speed, and stop counts.
export default function TripSummary({ trip }: { trip: Trip }) {
  const fuel = trip.stops.filter((s) => s.kind === 'fuel').length
  const breaks = trip.stops.filter((s) => s.kind === 'break').length
  const stats = [
    { k: 'Total miles', v: `${Math.round(trip.totalMiles).toLocaleString()} mi` },
    { k: 'Drive time', v: fmtDur(trip.totalDriveMin) },
    { k: 'Trip days', v: String(trip.daysCount) },
    { k: 'Avg speed', v: `${trip.effectiveMph.toFixed(0)} mph` },
    { k: 'Fuel stops', v: String(fuel) },
    { k: 'Rest breaks', v: String(breaks) },
  ]
  return (
    <div className="summary-grid">
      {stats.map((s) => (
        <div className="summary-card" key={s.k}>
          <span className="summary-num">{s.v}</span>
          <span className="summary-label">{s.k}</span>
        </div>
      ))}
    </div>
  )
}
