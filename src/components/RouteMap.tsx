import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { simplifyPath } from '../lib/geo'
import { pin } from './mapPins'
import StopMarker from './StopMarker'
import type { Trip } from '../types'

// Leaflet route map with the simplified polyline and origin/pickup/dropoff pins.
// Can expand to a fullscreen fixed overlay: enables scroll-wheel zoom on expand
// (the wheel is otherwise disabled so the page keeps scrolling) and closes on Esc.
export default function RouteMap({ trip }: { trip: Trip }) {
  const [expanded, setExpanded] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  // Ramer–Douglas–Peucker at 30 m keeps the route shape while cutting
  // tens of thousands of OSRM geometry points down to a renderable set.
  const polyline = useMemo(
    () => simplifyPath(trip.geometry, 30).map((p) => [p.lat, p.lng] as [number, number]),
    [trip.geometry],
  )
  const bounds = useMemo(() => {
    const all: Array<[number, number]> = [
      ...polyline,
      [trip.origin.coord.lat, trip.origin.coord.lng],
      [trip.pickup.coord.lat, trip.pickup.coord.lng],
      [trip.dropoff.coord.lat, trip.dropoff.coord.lng],
      ...trip.stops.map((s) => [s.coord.lat, s.coord.lng] as [number, number]),
    ]
    return L.latLngBounds(all)
  }, [polyline, trip.origin.coord, trip.pickup.coord, trip.dropoff.coord, trip.stops])

  useEffect(() => {
    if (expanded) {
      const id = window.setTimeout(() => {
        mapRef.current?.invalidateSize()
        mapRef.current?.scrollWheelZoom.enable()
      }, 80)
      return () => window.clearTimeout(id)
    }
    mapRef.current?.scrollWheelZoom.disable()
  }, [expanded])

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded])

  const toggle = () => setExpanded((e) => !e)

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
        <Polyline
          positions={polyline}
          pathOptions={{ color: '#f07d00', weight: 5, opacity: 0.9 }}
        />
        <Marker position={[trip.origin.coord.lat, trip.origin.coord.lng]} icon={pin('origin')}>
          <Tooltip direction="top" offset={[0, -8]}>Origin · {trip.origin.label}</Tooltip>
        </Marker>
        <Marker position={[trip.pickup.coord.lat, trip.pickup.coord.lng]} icon={pin('pickup')}>
          <Tooltip direction="top" offset={[0, -8]}>Pickup · {trip.pickup.label}</Tooltip>
        </Marker>
        <Marker position={[trip.dropoff.coord.lat, trip.dropoff.coord.lng]} icon={pin('dropoff')}>
          <Tooltip direction="top" offset={[0, -8]}>Drop-off · {trip.dropoff.label}</Tooltip>
        </Marker>
        {trip.stops.map((s, i) => (
          <StopMarker key={`${s.kind}-${i}`} stop={s} />
        ))}
      </MapContainer>
      <button
        type="button"
        className="map-expand-btn"
        aria-label={expanded ? 'Minimize map' : 'Expand map'}
        title={expanded ? 'Minimize map (Esc)' : 'Expand map'}
        onClick={toggle}
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
