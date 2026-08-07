import { Marker, Tooltip } from 'react-leaflet'
import { pin } from './mapPins'
import type { StopInfo } from '../types'

// Map marker for a rest/fuel/pickup stop; shows label, time and cumulative mile on hover.
export default function StopMarker({ stop }: { stop: StopInfo }) {
  return (
    <Marker position={[stop.coord.lat, stop.coord.lng]} icon={pin('stop')}>
      <Tooltip direction="top" offset={[0, -8]}>
        <strong>{stop.label}</strong> · {stop.time}
        <br />
        {stop.location} · mi {stop.cumMiles}
      </Tooltip>
    </Marker>
  )
}
