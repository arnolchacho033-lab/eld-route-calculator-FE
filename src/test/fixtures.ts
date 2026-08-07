import type { DailyLog, LatLng, Place, Trip, TripEvent } from '../types'

export function mkEvent(
  over: Pick<TripEvent, 'kind' | 'status' | 'startMin' | 'endMin' | 'location' | 'note'> &
    Partial<TripEvent>,
): TripEvent {
  return { miles: undefined, coord: undefined, ...over }
}

export const mkLog = (day: number): DailyLog => ({
  day,
  dateLabel: day === 1 ? '08/07/2026' : '08/08/2026',
  events: [
    mkEvent({ kind: 'offduty', status: 'OFF_DUTY', startMin: 0, endMin: 300, location: 'Dallas, TX', note: 'Off duty before start of work' }),
    mkEvent({ kind: 'pretrip', status: 'ON_DUTY', startMin: 300, endMin: 315, location: 'Dallas, TX', note: 'Pre-trip inspection' }),
    mkEvent({ kind: 'driving', status: 'DRIVING', startMin: 315, endMin: 1000, location: 'Memphis, TN', note: 'Driving', miles: 400 }),
    mkEvent({ kind: 'sleeper', status: 'SLEEPER', startMin: 1000, endMin: 1440, location: 'Mile ~400', note: '10-hour sleeper berth' }),
  ],
  totals: { OFF_DUTY: 300, SLEEPER: 440, DRIVING: 685, ON_DUTY: 15 },
  miles: 400,
  driveMin: 685,
  avgMph: 400 / (685 / 60),
  startOdo: 100000,
  endOdo: 100400,
  fromLabel: 'Dallas, TX',
  toLabel: 'Memphis, TN',
})

const coord: LatLng = { lat: 32.7, lng: -96.7 }
const place: Place = { label: 'Dallas, TX', coord }

export const mkTrip = (over: Partial<Trip> = {}): Trip => ({
  origin: place,
  pickup: place,
  dropoff: place,
  geometry: [coord, coord],
  totalMiles: 1880,
  totalDriveMin: 1974,
  effectiveMph: 57.1,
  stops: [{ kind: 'fuel', label: 'Fuel stop', time: '10:30', location: 'Mile ~1000', coord, cumMiles: 1000 }],
  days: [mkLog(1)],
  cycleUsed: 20,
  cycleRestart: false,
  departLabel: '08/07/2026 00:00',
  arriveLabel: '08/09/2026 14:40',
  daysCount: 1,
  ...over,
})
