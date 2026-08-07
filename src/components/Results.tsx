import type { Trip } from '../types'
import { fmtDur } from '../lib/hos'
import RouteMap from './RouteMap'
import StopsTimeline from './StopsTimeline'
import TripSummary from './TripSummary'
import LogSheets from './LogSheets'

type Props = {
  trip: Trip
  onReset: () => void
}

// Assembles the post-calculation view: summary stats, route map, stop timeline
// and per-day log sheets, plus a warning banner when a 34-hour restart is planned.
export default function Results({ trip, onReset }: Props) {
  return (
    <section id="results" className="panel-section">
      <div className="results-head">
        <div>
          <h2>Trip plan</h2>
          <p className="section-sub">
            {trip.origin.label} → {trip.pickup.label} → {trip.dropoff.label} · depart{' '}
            {trip.departLabel} · arrive {trip.arriveLabel}
          </p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={onReset}>
          Plan another trip
        </button>
      </div>

      {trip.cycleRestart && (
        <div className="warn-banner">
          You had {trip.cycleUsed} hours already used in your 70-hour / 8-day cycle, so this trip
          would have exceeded it. The plan includes a <strong>34-hour restart</strong> (per 49 CFR
          §395.3(c)) — after that, a fresh 70-hour cycle is available.
        </div>
      )}

      <TripSummary trip={trip} />

      <div className="trip-grid">
        <div className="map-panel">
          <h3>Route</h3>
          <RouteMap trip={trip} />
        </div>
        <div className="stops-panel">
          <h3>Stops &amp; rest · {fmtDur(trip.totalDriveMin)} driving</h3>
          <StopsTimeline trip={trip} />
        </div>
      </div>

      <h3 className="logs-title">
        Daily log sheets <span>({trip.daysCount} day{trip.daysCount > 1 ? 's' : ''})</span>
      </h3>
      <LogSheets trip={trip} />
    </section>
  )
}
