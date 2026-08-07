import type { LatLng, Place, TripInput } from '../types'

// The Django backend (backend/) proxies geocoding (Nominatim) and routing
// (OSRM) so the browser only talks to our own origin.
// VITE_BACKEND_URL points at the deployed backend (e.g. https://<project>.vercel.app);
// it falls back to the local Django server during development.
const API_URL = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')}/api/plan/`
  : 'http://localhost:8000/api/plan/'

export type RouteLegResult = {
  from: LatLng
  to: LatLng
  distance_m: number
  duration_s: number
  geometry: LatLng[]
}

export type PlanResult = {
  places: { origin: Place; pickup: Place; dropoff: Place }
  legs: RouteLegResult[]
}

export async function planRoute(input: TripInput): Promise<PlanResult> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: input.origin,
      pickup: input.pickup,
      dropoff: input.dropoff,
    }),
  })
  if (!res.ok) {
    let message = `Planning request failed (${res.status}).`
    try {
      const data = (await res.json()) as { error?: string }
      if (data?.error) message = data.error
    } catch {
      // keep the status-based message when the body is not JSON
    }
    throw new Error(message)
  }
  return (await res.json()) as PlanResult
}
