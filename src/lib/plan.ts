import { planRoute } from '../api/routing'
import { simulateTrip, fmtMin, DAY_MIN } from './hos'
import { buildDailyLogs } from './logs'
import { METERS_PER_MILE } from './geo'
import type { SimInput, Trip, TripInput } from '../types'

export async function planTrip(input: TripInput): Promise<Trip> {
  const result = await planRoute(input)
  const { origin, pickup, dropoff } = result.places
  const [leg1, leg2] = result.legs

  const miles1 = leg1.distance_m / METERS_PER_MILE
  const miles2 = leg2.distance_m / METERS_PER_MILE
  const totalMiles = miles1 + miles2
  const totalDriveMin = (leg1.duration_s + leg2.duration_s) / 60

  const geometry = [...leg1.geometry, ...leg2.geometry]
  const simInput: SimInput = {
    legMiles: [miles1, miles2],
    driveMin: totalDriveMin,
    cycleUsed: input.cycleUsed,
    labels: { origin: origin.label, pickup: pickup.label, dropoff: dropoff.label },
    geometry,
  }
  const sim = simulateTrip(simInput)

  const days = buildDailyLogs(sim.events, new Date())

  const lastEnd = sim.events.length
    ? sim.events[sim.events.length - 1].endMin
    : 0
  const arriveDay = Math.floor(lastEnd / DAY_MIN) + 1
  const arriveDate = new Date()
  arriveDate.setDate(arriveDate.getDate() + (arriveDay - 1))
  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

  return {
    origin,
    pickup,
    dropoff,
    geometry,
    totalMiles,
    totalDriveMin,
    effectiveMph: totalDriveMin > 0 ? totalMiles / (totalDriveMin / 60) : 0,
    stops: sim.stops,
    days,
    cycleUsed: input.cycleUsed,
    cycleRestart: sim.cycleRestart,
    departLabel: `${fmtDate(new Date())} 00:00`,
    arriveLabel: `${fmtDate(arriveDate)} ${fmtMin(lastEnd)}`,
    daysCount: days.length,
  }
}
