import type { SimInput, SimResult } from '../types'
import type { DutyStatus, EventKind, StopInfo, TripEvent } from '../types'
import { METERS_PER_MILE, pointAlongPath } from './geo'

export const DAY_MIN = 1440
export const HOUR = 60

export const MAX_DRIVE = 11 * HOUR
export const DUTY_WINDOW = 14 * HOUR
export const BREAK_CLOCK = 8 * HOUR
export const BREAK_LEN = 30
export const SLEEP_LEN = 10 * HOUR
export const FUEL_INTERVAL_MI = 1000
export const FUEL_LEN = 30
export const PICKUP_LEN = HOUR
export const DROPOFF_LEN = HOUR
export const PRETRIP_LEN = 15
export const CYCLE_LIMIT = 70
export const RESTART_LEN = 34 * HOUR
export const WORK_START = 5 * HOUR

export const STATUS_SHORT: Record<DutyStatus, string> = {
  OFF_DUTY: 'Off Duty',
  SLEEPER: 'Sleeper',
  DRIVING: 'Driving',
  ON_DUTY: 'On Duty',
}

export function fmtMin(min: number): string {
  const m = ((min % DAY_MIN) + DAY_MIN) % DAY_MIN
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function fmtDur(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function simulateTrip(input: SimInput): SimResult {
  const totalMiles = input.legMiles[0] + input.legMiles[1]
  const mph = input.driveMin > 0 ? totalMiles / (input.driveMin / HOUR) : 50
  const pickupMiles = input.legMiles[0]

  const events: TripEvent[] = []
  const stops: StopInfo[] = []
  let cycleOnDutyMin = 0

  const push = (ev: TripEvent) => {
    events.push(ev)
    if (ev.status === 'ON_DUTY' || ev.status === 'DRIVING') {
      cycleOnDutyMin += ev.endMin - ev.startMin
    }
  }

  const pushStop = (ev: TripEvent, cum: number) => {
    if (!ev.coord) return
    stops.push({
      kind: ev.kind,
      label: stopLabel(ev.kind),
      time: fmtMin(ev.startMin),
      location: ev.location,
      coord: ev.coord,
      cumMiles: Math.round(cum),
    })
  }

  const stopLabel = (kind: EventKind): string => {
    switch (kind) {
      case 'break':
        return 'Rest break'
      case 'fuel':
        return 'Fuel stop'
      case 'pickup':
        return 'Pickup'
      case 'dropoff':
        return 'Drop-off'
      case 'restart':
        return '34-hour restart'
      case 'sleeper':
        return '10-hour rest'
      default:
        return kind
    }
  }

  let t = 0
  let cumMiles = 0
  let fuelSince = 0
  let dayDrive = 0
  let driveSinceBreak = 0
  let windowEnd = 0
  let cycleUsedHrs = input.cycleUsed
  const cycleMinLeft = () => CYCLE_LIMIT * HOUR - (cycleUsedHrs * HOUR + cycleOnDutyMin)
  let restartUsed = false
  let pickupDone = false
  let remainingDrive = input.driveMin

  const atCum = (miles: number) => pointAlongPath(input.geometry, miles * METERS_PER_MILE)

  const doPretrip = () => {
    const start = t
    windowEnd = start + DUTY_WINDOW
    const loc = cumMiles > 0.5 ? `Mile ~${Math.round(cumMiles)}` : input.labels.origin
    push({
      kind: 'pretrip',
      status: 'ON_DUTY',
      startMin: start,
      endMin: start + PRETRIP_LEN,
      location: loc,
      note: 'Pre-trip inspection',
      coord: atCum(cumMiles),
    })
    t += PRETRIP_LEN
  }

  const rest = (len: number, note: string, kind: EventKind) => {
    const start = t
    const ev: TripEvent = {
      kind,
      status: 'SLEEPER',
      startMin: start,
      endMin: start + len,
      location: `Mile ~${Math.round(cumMiles)}`,
      note,
      coord: atCum(cumMiles),
    }
    push(ev)
    pushStop(ev, cumMiles)
    t += len
    dayDrive = 0
    driveSinceBreak = 0
    if (kind === 'restart') {
      restartUsed = true
      cycleUsedHrs = 0
      cycleOnDutyMin = 0
    }
    doPretrip()
  }

  const addStop = (
    kind: EventKind,
    status: DutyStatus,
    len: number,
    location: string,
    note: string,
    atMiles = cumMiles,
  ): TripEvent => {
    const ev: TripEvent = {
      kind,
      status,
      startMin: t,
      endMin: t + len,
      location,
      note,
      coord: atCum(atMiles),
    }
    push(ev)
    pushStop(ev, atMiles)
    t += len
    return ev
  }

  push({
    kind: 'offduty',
    status: 'OFF_DUTY',
    startMin: 0,
    endMin: WORK_START,
    location: input.labels.origin,
    note: 'Off duty before start of work',
  })
  t = WORK_START
  doPretrip()

  while (remainingDrive > 0.001) {
    let seg = remainingDrive

    if (fuelSince < FUEL_INTERVAL_MI) {
      seg = Math.min(seg, ((FUEL_INTERVAL_MI - fuelSince) / mph) * HOUR)
    }
    if (cumMiles < pickupMiles) {
      seg = Math.min(seg, ((pickupMiles - cumMiles) / mph) * HOUR)
    }
    if (driveSinceBreak < BREAK_CLOCK) {
      seg = Math.min(seg, BREAK_CLOCK - driveSinceBreak)
    }
    seg = Math.min(seg, MAX_DRIVE - dayDrive)
    seg = Math.min(seg, windowEnd - t)
    seg = Math.min(seg, cycleMinLeft())

    if (seg < 1) {
      if (cycleMinLeft() < 1) {
        rest(RESTART_LEN, '34-hour restart — cycle limit reached', 'restart')
        continue
      }
      if (windowEnd - t < 1) {
        rest(SLEEP_LEN, '10-hour sleeper berth', 'sleeper')
        continue
      }
      if (MAX_DRIVE - dayDrive < 1) {
        rest(SLEEP_LEN, '10-hour sleeper berth', 'sleeper')
        continue
      }
      seg = 1
    }

    seg = Math.max(1, Math.round(seg))

    const start = t
    const miles = (seg / HOUR) * mph
    const midMiles = cumMiles + miles / 2
    const toward = cumMiles < pickupMiles ? input.labels.pickup : input.labels.dropoff
    push({
      kind: 'driving',
      status: 'DRIVING',
      startMin: start,
      endMin: start + seg,
      location: toward,
      note: 'Driving',
      miles,
      coord: atCum(midMiles),
    })
    t += seg
    cumMiles += miles
    fuelSince += miles
    remainingDrive -= seg
    dayDrive += seg
    driveSinceBreak += seg

    if (remainingDrive <= 0.001) {
      addStop('dropoff', 'ON_DUTY', DROPOFF_LEN, input.labels.dropoff, 'Drop-off / unloading')
      break
    }

    if (driveSinceBreak >= BREAK_CLOCK && dayDrive < MAX_DRIVE) {
      addStop('break', 'OFF_DUTY', BREAK_LEN, `Mile ~${Math.round(cumMiles)}`, '30-minute rest break')
      driveSinceBreak = 0
      continue
    }

    if (fuelSince + 0.6 >= FUEL_INTERVAL_MI) {
      addStop('fuel', 'ON_DUTY', FUEL_LEN, `Mile ~${Math.round(cumMiles)}`, 'Fuel stop')
      fuelSince = 0
      continue
    }

    if (cumMiles >= pickupMiles && !pickupDone) {
      addStop('pickup', 'ON_DUTY', PICKUP_LEN, input.labels.pickup, 'Pickup / loading', pickupMiles)
      pickupDone = true
      continue
    }

    continue
  }

  return {
    events,
    stops,
    cycleRestart: restartUsed,
  }
}
