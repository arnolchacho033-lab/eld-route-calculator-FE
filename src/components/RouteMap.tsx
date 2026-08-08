import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { simplifyPath } from '../lib/geo'
import { pin } from './mapPins'
import StopMarker from './StopMarker'
import type { LatLng, Trip } from '../types'

const EXPAND_DELAY_MS = 80

// Leaflet route map: simplified polyline, origin/pickup/dropoff pins and stop
// markers. Expanding to fullscreen enables scroll-wheel zoom and Esc-to-close
// (the wheel is disabled while inline so the page keeps scrolling).
export default function RouteMap({ trip }: { trip: Trip }) {
  const [expanded, setExpanded] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  // Ramer–Douglas–Peucker at 30 m keeps the route shape while cutting the tens
  // of thousands of OSRM geometry points down to a renderable set.
  const polyline = useMemo(
    () => simplifyPath(trip.geometry, 30).map((p) => [p.lat, p.lng] as [number, number]),
    [trip.geometry],
  )

  // Fit the whole trip on screen: route line, stops and the three waypoints.
  const bounds = useMemo(() => {
    const points: Array<[number, number]> = [
      ...polyline,
      ...trip.stops.map((s) => [s.coord.lat, s.coord.lng] as [number, number]),
      ...[trip.origin, trip.pickup, trip.dropoff].map(
        (p) => [p.coord.lat, p.coord.lng] as [number, number],
      ),
    ]
    return L.latLngBounds(points)
  }, [polyline, trip.origin, trip.pickup, trip.dropoff, trip.stops])

  useEffect(() => {
    if (!expanded) {
      mapRef.current?.scrollWheelZoom.disable()
      return
    }
    const id = window.setTimeout(() => {
      mapRef.current?.invalidateSize()
      mapRef.current?.scrollWheelZoom.enable()
    }, EXPAND_DELAY_MS)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('keydown', onKey)
    }
  }, [expanded])

  const waypoints: Array<{ kind: 'origin' | 'pickup' | 'dropoff'; coord: LatLng; label: string }> = [
    { kind: 'origin', coord: trip.origin.coord, label: `Origin · ${trip.origin.label}` },
    { kind: 'pickup', coord: trip.pickup.coord, label: `Pickup · ${trip.pickup.label}` },
    { kind: 'dropoff', coord: trip.dropoff.coord, label: `Drop-off · ${trip.dropoff.label}` },
  ]

  return (
    <div className={expanded ? 'map-shell map-shell--expanded' : 'map-shell'}>
      <MapContainer
        ref={mapRef}
        bounds={bounds}
        boundsOptions={{ padding: [40, 40] }}
        scrollWheelZoom={false}
        className="route-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Polyline positions={polyline} pathOptions={{ color: '#f07d00', weight: 5, opacity: 0.9 }} />
        {waypoints.map((w) => (
          <Marker key={w.kind} position={[w.coord.lat, w.coord.lng]} icon={pin(w.kind)}>
            <Tooltip direction="top" offset={[0, -8]}>{w.label}</Tooltip>
          </Marker>
        ))}
        {trip.stops.map((s, i) => (
          <StopMarker key={`${s.kind}-${i}`} stop={s} />
        ))}
      </MapContainer>
      <button
        type="button"
        className="map-expand-btn"
        aria-label={expanded ? 'Minimize map' : 'Expand map'}
        title={expanded ? 'Minimize map (Esc)' : 'Expand map'}
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
          </svg>
        )}
      </button>
    </div>
  )
}
