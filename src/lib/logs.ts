import type { DailyLog, DutyStatus, TripEvent } from '../types'
import { DAY_MIN } from './hos'

export const STATUS_ORDER: DutyStatus[] = ['OFF_DUTY', 'SLEEPER', 'DRIVING', 'ON_DUTY']

export function fmtHhMm(min: number): string {
  const m = Math.max(0, Math.round(min))
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function clipToDay(e: TripEvent, lo: number, hi: number): TripEvent | null {
  const s = Math.max(e.startMin, lo)
  const en = Math.min(e.endMin, hi)
  if (s >= en) return null
  const dur = e.endMin - e.startMin
  const miles = e.miles !== undefined ? (e.miles * (en - s)) / dur : undefined
  return { ...e, startMin: s - lo, endMin: en - lo, miles }
}

export function buildDailyLogs(events: TripEvent[], startDate: Date): DailyLog[] {
  const maxDay = events.reduce(
    (m, e) => Math.max(m, Math.floor(e.endMin / DAY_MIN) + 1),
    1,
  )
  const logs: DailyLog[] = []
  let prevOdo = 100000

  for (let day = 1; day <= maxDay; day++) {
    const lo = (day - 1) * DAY_MIN
    const hi = day * DAY_MIN

    const clipped: TripEvent[] = []
    for (const e of events) {
      const c = clipToDay(e, lo, hi)
      if (c) clipped.push(c)
    }

    if (day === maxDay) {
      const lastEndMin = clipped.length ? clipped[clipped.length - 1].endMin : 0
      if (lastEndMin < DAY_MIN) {
        clipped.push({
          kind: 'offduty',
          status: 'OFF_DUTY',
          startMin: lastEndMin,
          endMin: DAY_MIN,
          location: 'End of trip',
          note: 'Off duty',
        })
      }
    }

    const totals: Record<DutyStatus, number> = {
      OFF_DUTY: 0,
      SLEEPER: 0,
      DRIVING: 0,
      ON_DUTY: 0,
    }
    let miles = 0
    let driveMin = 0
    for (const e of clipped) {
      totals[e.status] += e.endMin - e.startMin
      if (e.status === 'DRIVING') {
        driveMin += e.endMin - e.startMin
        if (e.miles) miles += e.miles
      }
    }

    const drivingEvents = clipped.filter((e) => e.status === 'DRIVING')
    const fromLabel = drivingEvents[0]?.location ?? clipped[0]?.location ?? ''
    const toLabel =
      drivingEvents[drivingEvents.length - 1]?.location ??
      clipped[clipped.length - 1]?.location ??
      ''

    const date = new Date(startDate)
    date.setDate(date.getDate() + (day - 1))
    const dateLabel = date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })

    logs.push({
      day,
      dateLabel,
      events: clipped,
      totals,
      miles: Math.round(miles),
      driveMin,
      avgMph: driveMin > 0 ? miles / (driveMin / 60) : 0,
      startOdo: prevOdo,
      endOdo: prevOdo + Math.round(miles),
      fromLabel,
      toLabel,
    })
    prevOdo += Math.round(miles)
  }

  return logs
}
