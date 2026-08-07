import { useState } from 'react'
import type { FormEvent } from 'react'
import type { TripInput } from '../types'

type Props = {
  busy: boolean
  onPlan: (input: TripInput) => void
}

// Origin/pickup/dropoff address form plus cycle-used hours.
// Controlled inputs; submit trims text fields and coerces the cycle field to a number.
export default function TripForm({ busy, onPlan }: Props) {
  const [origin, setOrigin] = useState('')
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [cycleUsed, setCycleUsed] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onPlan({
      origin: origin.trim(),
      pickup: pickup.trim(),
      dropoff: dropoff.trim(),
      cycleUsed: Number(cycleUsed) || 0,
    })
  }

  return (
    <form className="trip-form" onSubmit={submit}>
      <div className="form-block">
        <h3 className="form-title">Trip</h3>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="origin">Current location</label>
            <input
              id="origin"
              type="text"
              required
              placeholder="e.g. 1200 Oak St, Dallas, TX"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="pickup">Pickup location</label>
            <input
              id="pickup"
              type="text"
              required
              placeholder="e.g. 44 Freight Ave, Memphis, TN"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="dropoff">Dropoff location</label>
            <input
              id="dropoff"
              type="text"
              required
              placeholder="e.g. 800 Dock Rd, Phoenix, AZ"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="cycle">Current cycle used (hrs)</label>
            <input
              id="cycle"
              type="number"
              min={0}
              max={70}
              step={0.5}
              placeholder="e.g. 22.5"
              value={cycleUsed}
              onChange={(e) => setCycleUsed(e.target.value)}
            />
          </div>
        </div>
      </div>

      <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
        {busy ? 'Planning…' : 'Calculate route'}
      </button>
    </form>
  )
}
