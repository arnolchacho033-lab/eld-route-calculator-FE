import type { LatLng } from '../types'

export const METERS_PER_MILE = 1609.344

export function haversine(a: LatLng, b: LatLng): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export function pointAlongPath(points: LatLng[], meters: number): LatLng {
  if (points.length === 0) return { lat: 0, lng: 0 }
  if (meters <= 0) return points[0]
  let target = meters
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const seg = haversine(a, b)
    if (target <= seg) {
      const f = seg === 0 ? 0 : target / seg
      return { lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f }
    }
    target -= seg
  }
  return points[points.length - 1]
}

function pointToSegmentDistance(p: LatLng, a: LatLng, b: LatLng): number {
  const dx = b.lng - a.lng
  const dy = b.lat - a.lat
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return haversine(p, a)
  const t = Math.max(0, Math.min(1, ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / len2))
  return haversine(p, { lng: a.lng + t * dx, lat: a.lat + t * dy })
}

export function simplifyPath(points: LatLng[], toleranceM: number): LatLng[] {
  if (points.length <= 2) return points
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1
  const stack: Array<[number, number]> = [[0, points.length - 1]]
  while (stack.length > 0) {
    const [start, end] = stack.pop()!
    if (end - start < 2) continue
    let maxD = 0
    let maxI = -1
    for (let i = start + 1; i < end; i++) {
      const d = pointToSegmentDistance(points[i], points[start], points[end])
      if (d > maxD) {
        maxD = d
        maxI = i
      }
    }
    if (maxI > 0 && maxD > toleranceM) {
      keep[maxI] = 1
      stack.push([start, maxI], [maxI, end])
    }
  }
  const out: LatLng[] = []
  for (let i = 0; i < points.length; i++) {
    if (keep[i]) out.push(points[i])
  }
  return out
}
