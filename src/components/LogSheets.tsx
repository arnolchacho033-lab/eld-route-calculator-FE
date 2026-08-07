import { useState } from 'react'
import type { Trip } from '../types'
import LogSheet from './LogSheet'

// Tabs one sheet per trip day; inactive sheets are hidden via .is-hidden
// (kept in the DOM so print styles can show every sheet).
export default function LogSheets({ trip }: { trip: Trip }) {
  const [active, setActive] = useState(1)
  return (
    <div className="log-sheets">
      <div className="log-tabs">
        {trip.days.map((d) => (
          <button
            key={d.day}
            type="button"
            className={d.day === active ? 'log-tab log-tab--active' : 'log-tab'}
            onClick={() => setActive(d.day)}
          >
            Day {d.day}
            <small>{d.dateLabel}</small>
          </button>
        ))}
        <button type="button" className="btn btn-print" onClick={() => window.print()}>
          Print logs
        </button>
      </div>
      {trip.days.map((d) => (
        <div key={d.day} className={d.day === active ? 'log-sheet-wrap' : 'log-sheet-wrap is-hidden'}>
          <LogSheet log={d} />
        </div>
      ))}
    </div>
  )
}
