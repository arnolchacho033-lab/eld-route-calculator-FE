import { useEffect, useState } from 'react'
import './App.css'
import TripForm from './components/TripForm'
import Results from './components/Results'
import { planTrip } from './lib/plan'
import type { Trip, TripInput } from './types'

// Top-level page: collects trip input, calls planTrip (geocoding → routing → HOS
// simulation) and shows either the form/loading state or the results view.
function App() {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (trip) {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [trip])

  const handlePlan = async (input: TripInput) => {
    setBusy(true)
    setError(null)
    try {
      const t = await planTrip(input)
      setTrip(t)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong while planning the trip.')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setTrip(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <svg className="brand-logo" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M2 5v14h20V7h-9.5L10 5H2z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M3 15h18M15 11h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="brand-name">
            ELD <em>Route Calculator</em>
          </span>
        </div>
        <nav className="nav">
          <a href="#planner">Trip Planner</a>
          <a href="#results">Route &amp; Logs</a>
          <a href="#how">How it works</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">HOURS OF SERVICE · FMCSA</p>
            <h1>
              Route it. <span>Log it.</span> Drive it.
            </h1>
            <p className="subtitle">
              Enter your stops and cycle hours — get a driving plan, rest stops
              and ready-to-print daily log sheets drawn for every day of the haul.
            </p>
            <div className="hero-actions">
              <a href="#planner" className="btn btn-primary">
                Plan a trip
              </a>
              <a href="#how" className="btn btn-ghost">
                How it works
              </a>
            </div>
          </div>

          <div className="dash" aria-label="Truck dashboard preview">
            <div className="dash-top">
              <div className="gauge">
                <span className="gauge-num">11h</span>
                <span className="gauge-label">DRIVE LIMIT</span>
              </div>
              <div className="nav-screen">
                <div className="nav-row">
                  <span className="nav-city">Dallas</span>
                  <span className="nav-arrow">&gt;</span>
                  <span className="nav-city">Memphis</span>
                  <span className="nav-arrow">&gt;</span>
                  <span className="nav-city">Phoenix</span>
                </div>
                <div className="nav-bar">
                  <span className="nav-fill"></span>
                  <span className="nav-marker">&#128663;</span>
                </div>
                <div className="nav-row nav-meta">
                  <span>1,480 mi</span>
                  <span>70h / 8d</span>
                  <span>14h duty</span>
                </div>
              </div>
              <div className="gauge">
                <span className="gauge-num">14h</span>
                <span className="gauge-label">DUTY WINDOW</span>
              </div>
            </div>
            <div className="dash-bottom">
              <div className="stat">
                <span className="stat-label">30-min break</span>
                <span className="stat-value">8h drive</span>
              </div>
              <div className="stat">
                <span className="stat-label">Fuel</span>
                <span className="stat-value">1,000 mi</span>
              </div>
              <div className="stat">
                <span className="stat-label">Rest</span>
                <span className="stat-value">10h</span>
              </div>
              <div className="stat stat-active">
                <span className="stat-label">Logs</span>
                <span className="stat-value">Auto</span>
              </div>
            </div>
          </div>
        </section>

        <section id="planner" className="panel-section">
          <h2>Plan your trip</h2>
          <p className="section-sub">
            Property-carrying, 70-hour / 8-day cycle. Fueling every 1,000 miles,
            a 30-minute break after 8 hours of driving, 10-hour rest between days,
            1 hour each for pickup and drop-off.
          </p>
          {error && <div className="error-banner">⚠ {error}</div>}
          <TripForm busy={busy} onPlan={handlePlan} />
          {busy && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Geocoding stops, routing the highway and planning rest breaks…</p>
            </div>
          )}
        </section>

        {trip && !busy && <Results trip={trip} onReset={reset} />}

        <section id="how" className="panel-section">
          <h2>Built for the road</h2>
          <div className="cards">
            <article className="card">
              <span className="card-icon">&#9201;</span>
              <h3>HOS aware</h3>
              <p>
                Drives to the FMCSA rules: 11-hour driving, 14-hour window, 30-minute
                break after 8 hours, 10-hour reset and a 70-hour cycle.
              </p>
            </article>
            <article className="card">
              <span className="card-icon">&#9981;</span>
              <h3>Fuel &amp; rest planned</h3>
              <p>
                Fuel stops every 1,000 miles and rest breaks are planned into the route
                so the schedule always lines up with the law.
              </p>
            </article>
            <article className="card">
              <span className="card-icon">&#128270;</span>
              <h3>Logs drawn for you</h3>
              <p>
                Every 24-hour period becomes a record-of-duty sheet with the duty grid,
                remarks and totals — ready to sign and print.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>&#128666; ELD Route Calculator — drive safe, trucker.</span>
        <span className="footer-note">Free tiles © OpenStreetMap · routing © OSRM · geocoding © Nominatim</span>
      </footer>
    </div>
  )
}

export default App
