import { describe, expect, it } from 'vitest'
import type { TripEvent } from '../types'
import { DAY_MIN } from './hos'
import { STATUS_ORDER, buildDailyLogs, fmtHhMm } from './logs'

const ev = (
  over: Pick<TripEvent, 'kind' | 'status' | 'startMin' | 'endMin' | 'location' | 'note'> &
    Partial<TripEvent>,
): TripEvent => ({ miles: undefined, coord: undefined, ...over })

const events: TripEvent[] = [
  ev({ kind: 'offduty', status: 'OFF_DUTY', startMin: 0, endMin: 300, location: 'Dallas, TX', note: 'Off duty before start of work' }),
  ev({ kind: 'pretrip', status: 'ON_DUTY', startMin: 300, endMin: 315, location: 'Dallas, TX', note: 'Pre-trip inspection' }),
  ev({ kind: 'driving', status: 'DRIVING', startMin: 315, endMin: 1000, location: 'Memphis, TN', note: 'Driving', miles: 400 }),
  ev({ kind: 'sleeper', status: 'SLEEPER', startMin: 1000, endMin: 1700, location: 'Mile ~400', note: '10-hour sleeper berth' }),
  ev({ kind: 'pretrip', status: 'ON_DUTY', startMin: 1700, endMin: 1715, location: 'Mile ~400', note: 'Pre-trip inspection' }),
  ev({ kind: 'driving', status: 'DRIVING', startMin: 1715, endMin: 2200, location: 'Phoenix, AZ', note: 'Driving', miles: 300 }),
  ev({ kind: 'dropoff', status: 'ON_DUTY', startMin: 2200, endMin: 2260, location: 'Phoenix, AZ', note: 'Drop-off / unloading' }),
]

describe('fmtHhMm', () => {
  it('formats minutes past midnight as HH:MM', () => {
    expect(fmtHhMm(0)).toBe('00:00')
    expect(fmtHhMm(60)).toBe('01:00')
    expect(fmtHhMm(1000)).toBe('16:40')
    expect(fmtHhMm(DAY_MIN)).toBe('24:00')
  })
})

describe('buildDailyLogs', () => {
  it('splits a multi-day trip into one log per 24-hour period', () => {
    const logs = buildDailyLogs(events, new Date(2026, 7, 7))
    expect(logs).toHaveLength(2)
    expect(logs.map((l) => l.day)).toEqual([1, 2])
  })

  it('totals exactly 24 hours per day', () => {
    for (const log of buildDailyLogs(events, new Date(2026, 7, 7))) {
      const total = STATUS_ORDER.reduce((s, st) => s + log.totals[st], 0)
      expect(total).toBe(DAY_MIN)
    }
  })

  it('stores day-relative minutes so paths for later days stay in viewBox', () => {
    const [d1, d2] = buildDailyLogs(events, new Date(2026, 7, 7))
    expect(d1.events[0]).toMatchObject({ status: 'OFF_DUTY', startMin: 0 })
    expect(d2.events[0]).toMatchObject({ status: 'SLEEPER', startMin: 0, endMin: 260 })
    for (const e of [...d1.events, ...d2.events]) {
      expect(e.startMin).toBeGreaterThanOrEqual(0)
      expect(e.endMin).toBeLessThanOrEqual(DAY_MIN)
    }
  })

  it('appends an off-duty "End of trip" event to the last day', () => {
    const last = buildDailyLogs(events, new Date(2026, 7, 7))[1]
    const tail = last.events[last.events.length - 1]
    expect(tail).toMatchObject({ kind: 'offduty', location: 'End of trip', endMin: DAY_MIN })
  })

  it('counts miles only for driving segments', () => {
    const [d1, d2] = buildDailyLogs(events, new Date(2026, 7, 7))
    expect(d1.miles).toBe(400)
    expect(d2.miles).toBe(300)
  })

  it('prorates miles when a driving event crosses midnight', () => {
    const crossing: TripEvent[] = [
      ev({ kind: 'driving', status: 'DRIVING', startMin: 1380, endMin: 1500, location: 'Midway, US', note: 'Driving', miles: 200 }),
    ]
    const [d1, d2] = buildDailyLogs(crossing, new Date(2026, 7, 7))
    expect(d1.miles).toBe(100)
    expect(d2.miles).toBe(100)
    expect(d1.events[0].miles).toBeCloseTo(100, 6)
    expect(d2.events[0].miles).toBeCloseTo(100, 6)
  })

  it('rolls the odometer forward day to day', () => {
    const [d1, d2] = buildDailyLogs(events, new Date(2026, 7, 7))
    expect(d1.startOdo).toBe(100000)
    expect(d1.endOdo).toBe(100400)
    expect(d2.startOdo).toBe(100400)
    expect(d2.endOdo).toBe(100700)
  })

  it('advances the date label one day per log', () => {
    const [d1, d2] = buildDailyLogs(events, new Date(2026, 7, 7))
    expect(d1.dateLabel).toBe('08/07/2026')
    expect(d2.dateLabel).toBe('08/08/2026')
  })
})
