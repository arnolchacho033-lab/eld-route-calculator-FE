import L from 'leaflet'

// Marker dot colors keyed by pin kind; 'stop' is reused for every rest/fuel stop.
export const KIND_COLOR: Record<string, string> = {
  origin: '#3ddc84',
  pickup: '#ffd27a',
  dropoff: '#ff5c5c',
  stop: '#f07d00',
}

// Builds a Leaflet divIcon: a small colored dot centered on the coordinate.
export function pin(kind: keyof typeof KIND_COLOR) {
  return L.divIcon({
    className: 'eld-pin',
    html: `<span class="eld-pin-dot" style="background:${KIND_COLOR[kind]}"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}
