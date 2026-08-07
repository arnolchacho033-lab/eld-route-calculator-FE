import type { ReactNode } from 'react'
import type { DailyLog, DutyStatus, TripEvent } from '../types'
import { STATUS_SHORT } from '../lib/hos'
import { STATUS_ORDER, fmtHhMm } from '../lib/logs'

const ROWS: DutyStatus[] = ['OFF_DUTY', 'SLEEPER', 'DRIVING', 'ON_DUTY']

const X0 = 44
const W = 930
const TOP = 8
const ROWH = 56
const BOTTOM = TOP + ROWH * 4

// SVG geometry: x scales day-relative minutes (0–1440) across the 24h grid,
// y places each segment on its duty-status row.
const x = (hour: number) => X0 + (hour / 24) * W
const y = (status: DutyStatus) => TOP + (ROWS.indexOf(status) + 0.5) * ROWH

// Traces the duty-status line: a horizontal segment per event plus a vertical
// jump between rows when consecutive statuses differ.
function buildPath(events: TripEvent[]): string {
  if (events.length === 0) return ''
  let d = ''
  events.forEach((e, i) => {
    const x1 = x(e.startMin / 60).toFixed(2)
    const x2 = x(e.endMin / 60).toFixed(2)
    const yy = y(e.status).toFixed(2)
    d += `${i === 0 ? 'M' : 'L'}${x1},${yy} `
    d += `L${x2},${yy} `
    if (i < events.length - 1) {
      const ny = y(events[i + 1].status).toFixed(2)
      if (ny !== yy) d += `L${x2},${ny} `
    }
  })
  return d.trim()
}

// Vertical hour lines (hourly majors, 15-minute minors) and horizontal status rows.
function gridLines() {
  const lines: ReactNode[] = []
  for (let h = 0; h <= 24; h++) {
    const px = x(h)
    lines.push(
      <line
        key={`maj-${h}`}
        x1={px}
        y1={TOP}
        x2={px}
        y2={BOTTOM}
        stroke={h % 24 === 0 ? '#000' : '#8a8f98'}
        strokeWidth={h % 24 === 0 ? 1.5 : 1}
      />,
    )
    if (h < 24) {
      for (const q of [15, 30, 45]) {
        const qx = x(h + q / 60)
        lines.push(
          <line key={`${h}-${q}`} x1={qx} y1={TOP} x2={qx} y2={BOTTOM} stroke="#d8d8d8" strokeWidth={0.6} />,
        )
      }
    }
  }
  for (let i = 0; i <= 4; i++) {
    const ry = TOP + i * ROWH
    lines.push(
      <line key={`h-${i}`} x1={X0} y1={ry} x2={X0 + W} y2={ry} stroke="#55595f" strokeWidth={i === 0 || i === 4 ? 1.5 : 1} />,
    )
  }
  return lines
}

function hourLabels() {
  const labels: ReactNode[] = []
  for (let h = 0; h <= 24; h += 2) {
    labels.push(
      <text key={h} x={x(h)} y={BOTTOM + 16} fontSize="10" fill="#333" textAnchor="middle" fontFamily="Consolas, Menlo, monospace">
        {h}
      </text>,
    )
  }
  return labels
}

function rowLabels() {
  return ROWS.map((r, i) => (
    <text key={r} x={X0 - 8} y={TOP + (i + 0.5) * ROWH + 3} fontSize="11" fontWeight="600" fill="#111" textAnchor="end">
      {STATUS_SHORT[r]}
    </text>
  ))
}

// One full 24-hour driver log sheet: header fields, SVG grid with the duty line,
// a remarks table of every event, and per-status totals.
export default function LogSheet({ log }: { log: DailyLog }) {
  const total = STATUS_ORDER.reduce((acc, s) => acc + log.totals[s], 0)
  return (
    <div className="log-sheet">
      <div className="log-head">
        <div className="log-title">
          Driver&rsquo;s Daily Log <span className="log-day">Day {log.day}</span>
        </div>
        <div className="log-head-grid">
          <div className="log-cell">
            <label>Date</label>
            <span>{log.dateLabel}</span>
          </div>
          <div className="log-cell">
            <label>From</label>
            <span>{log.fromLabel || '—'}</span>
          </div>
          <div className="log-cell">
            <label>To</label>
            <span>{log.toLabel || '—'}</span>
          </div>
          <div className="log-cell">
            <label>Miles</label>
            <span>{log.miles.toLocaleString()}</span>
          </div>
          <div className="log-cell">
            <label>Odometer</label>
            <span>
              {log.startOdo.toLocaleString()} → {log.endOdo.toLocaleString()}
            </span>
          </div>
          <div className="log-cell">
            <label>Avg MPH</label>
            <span>{log.avgMph.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <div className="log-grid-wrap">
        <svg viewBox={`0 0 ${X0 + W + 16} ${BOTTOM + 32}`} className="log-svg" role="img" aria-label={`Daily log grid day ${log.day}`}>
          {gridLines()}
          {hourLabels()}
          {rowLabels()}
          {log.events.length > 0 && (
            <path d={buildPath(log.events)} fill="none" stroke="#0a0a0a" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
          )}
        </svg>
      </div>

      <div className="log-body">
        <div className="log-remarks">
          <div className="log-sub">Remarks (location · activity)</div>
          <table className="remark-table">
            <tbody>
              {log.events.map((e, i) => (
                <tr key={i}>
                  <td className="rt-time">{fmtHhMm(e.startMin)}</td>
                  <td className="rt-loc">{e.location}</td>
                  <td className="rt-note">{e.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="log-totals">
          <div className="log-sub">Hours per status</div>
          <table className="total-table">
            <tbody>
              {STATUS_ORDER.map((s) => (
                <tr key={s}>
                  <td>{STATUS_SHORT[s]}</td>
                  <td>{fmtHhMm(log.totals[s])}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>Total</td>
                <td>{fmtHhMm(total)}</td>
              </tr>
            </tbody>
          </table>
          <div className="log-sig">
            <div className="sig-line">Driver signature</div>
            <div className="sig-caption">Certified true and correct</div>
          </div>
        </div>
      </div>
    </div>
  )
}
