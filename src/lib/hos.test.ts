import { describe, expect, it } from 'vitest'
import type { SimInput } from '../types'
import {
  BREAK_CLOCK,
  BREAK_LEN,
  DROPOFF_LEN,
  DUTY_WINDOW,
  FUEL_INTERVAL_MI,
  HOUR,
  MAX_DRIVE,
  PICKUP_LEN,
  PRETRIP_LEN,
  RESTART_LEN,
  SLEEP_LEN,
  WORK_START,
  fmtDur,
  fmtMin,
  simulateTrip,
} from './hos'

const DAY_WRAP = 1440

const geometry = [
  { lat: 32.7, lng: -96.7 },
  { lat: 35.1, lng: -90.0 },
  { lat: 33.4, lng: -112.0 },
]

const makeInput = (overrides: Partial<SimInput> = {}): SimInput => ({
  legMiles: [453, 1427],
  driveMin: 1974,
  cycleUsed: 20,
  labels: { origin: 'Dallas, TX', pickup: 'Memphis, TN', dropoff: 'Phoenix, AZ' },
  geometry,
  ...overrides,
})

describe('fmtMin / fmtDur', () => {
  it('wraps fmtMin at midnight', () => {
    expect(fmtMin(0)).toBe('00:00')
    expect(fmtMin(300)).toBe('05:00')
    expect(fmtMin(DAY_WRAP)).toBe('00:00')
  })

  it('formats durations', () => {
    expect(fmtDur(45)).toBe('45m')
    expect(fmtDur(90)).toBe('1h 30m')
    expect(fmtDur(120)).toBe('2h')
  })
})

describe('simulateTrip', () => {
  it('starts off duty at 00:00 and runs a pre-trip at 05:00', () => {
    const sim = simulateTrip(makeInput())
    expect(sim.events[0]).toMatchObject({ kind: 'offduty', startMin: 0, endMin: WORK_START })
    expect(sim.events[1]).toMatchObject({
      kind: 'pretrip',
      status: 'ON_DUTY',
      startMin: WORK_START,
      endMin: WORK_START + PRETRIP_LEN,
    })
  })

  it('produces gapless, contiguous events', () => {
    const sim = simulateTrip(makeInput())
    let prev = 0
    for (const e of sim.events) {
      expect(e.startMin).toBeCloseTo(prev, 6)
      prev = e.endMin
    }
  })

  it('keeps every workday within the 11h driving / 14h window limits', () => {
    const sim = simulateTrip(makeInput())
    let dayStart = -1
    let windowEnd = 0
    let dayDrive = 0
    for (const e of sim.events) {
      if (e.status === 'ON_DUTY' || e.status === 'DRIVING') {
        if (dayStart < 0) {
          dayStart = e.startMin
          windowEnd = e.endMin
        } else {
          windowEnd = Math.max(windowEnd, e.endMin)
        }
        if (e.status === 'DRIVING') dayDrive += e.endMin - e.startMin
      } else if (e.endMin - e.startMin >= SLEEP_LEN) {
        expect(dayDrive).toBeLessThanOrEqual(MAX_DRIVE)
        expect(windowEnd - dayStart).toBeLessThanOrEqual(DUTY_WINDOW)
        dayStart = -1
        windowEnd = 0
        dayDrive = 0
      }
    }
    expect(dayDrive).toBeLessThanOrEqual(MAX_DRIVE)
  })

  it('schedules a 30-minute break after 8 continuous driving hours', () => {
    const sim = simulateTrip(makeInput({ legMiles: [1500, 1], driveMin: 20 * HOUR }))
    const breaks = sim.events.filter((e) => e.kind === 'break')
    expect(breaks.length).toBeGreaterThan(0)
    const b = breaks[0]
    expect(b.endMin - b.startMin).toBe(BREAK_LEN)
    expect(b.status).toBe('OFF_DUTY')
    expect(b.startMin).toBeGreaterThanOrEqual(WORK_START + PRETRIP_LEN + BREAK_CLOCK - 1)
  })

  it('places the first fuel stop near the 1,000-mile interval', () => {
    const sim = simulateTrip(makeInput())
    const fuel = sim.stops.find((s) => s.kind === 'fuel')
    expect(fuel).toBeDefined()
    expect(fuel!.cumMiles).toBeCloseTo(FUEL_INTERVAL_MI, 0)
  })

  it('keeps pickup before drop-off and gives both a 1-hour slot', () => {
    const sim = simulateTrip(makeInput())
    const pickup = sim.events.find((e) => e.kind === 'pickup')
    const dropoff = sim.events.find((e) => e.kind === 'dropoff')
    expect(pickup).toBeDefined()
    expect(dropoff).toBeDefined()
    expect(pickup!.status).toBe('ON_DUTY')
    expect(pickup!.endMin - pickup!.startMin).toBe(PICKUP_LEN)
    expect(dropoff!.endMin - dropoff!.startMin).toBe(DROPOFF_LEN)
    expect(pickup!.startMin).toBeLessThan(dropoff!.startMin)
  })

  it('ends the trip with a drop-off event', () => {
    const sim = simulateTrip(makeInput())
    expect(sim.events[sim.events.length - 1].kind).toBe('dropoff')
  })

  it('drives close to the requested drive time', () => {
    const sim = simulateTrip(makeInput())
    const drive = sim.events
      .filter((e) => e.kind === 'driving')
      .reduce((s, e) => s + (e.endMin - e.startMin), 0)
    expect(Math.abs(drive - 1974)).toBeLessThanOrEqual(20)
  })

  it('does not restart the cycle when usage is low', () => {
    expect(simulateTrip(makeInput({ cycleUsed: 20 })).cycleRestart).toBe(false)
  })

  it('triggers a 34-hour restart when the 70-hour cycle runs out', () => {
    const sim = simulateTrip(makeInput({ cycleUsed: 65 }))
    expect(sim.cycleRestart).toBe(true)
    const restart = sim.events.find((e) => e.kind === 'restart')
    expect(restart).toBeDefined()
    expect(restart!.endMin - restart!.startMin).toBe(RESTART_LEN)
    expect(restart!.status).toBe('SLEEPER')
  })
})
