import { describe, expect, it } from 'vitest'
import type { LatLng } from '../types'
import { haversine, pointAlongPath, simplifyPath } from './geo'

const dallas: LatLng = { lat: 32.7767, lng: -96.797 }
const memphis: LatLng = { lat: 35.1495, lng: -90.049 }

describe('haversine', () => {
  it('returns 0 for identical points', () => {
    expect(haversine(dallas, dallas)).toBe(0)
  })

  it('is symmetric', () => {
    expect(haversine(dallas, memphis)).toBeCloseTo(haversine(memphis, dallas), 6)
  })

  it('matches a known distance (Dallas–Memphis ≈ 645 km)', () => {
    const km = haversine(dallas, memphis) / 1000
    expect(km).toBeGreaterThan(600)
    expect(km).toBeLessThan(690)
  })
})

describe('pointAlongPath', () => {
  it('returns the first point for non-positive distances', () => {
    expect(pointAlongPath([dallas, memphis], 0)).toEqual(dallas)
    expect(pointAlongPath([dallas, memphis], -5)).toEqual(dallas)
  })

  it('interpolates near the exact midpoint of a leg', () => {
    const total = haversine(dallas, memphis)
    const mid = pointAlongPath([dallas, memphis], total / 2)
    expect(Math.abs(haversine(dallas, mid) - total / 2)).toBeLessThan(3000)
  })

  it('returns a vertex exactly when the distance lands on it', () => {
    const a: LatLng = { lat: 0, lng: 0 }
    const b: LatLng = { lat: 0.5, lng: 0.5 }
    const c: LatLng = { lat: 1, lng: 1 }
    const ab = haversine(a, b)
    const mid = pointAlongPath([a, b, c], ab)
    expect(mid.lat).toBeCloseTo(b.lat, 6)
    expect(mid.lng).toBeCloseTo(b.lng, 6)
  })

  it('clamps to the last point past the end of the path', () => {
    expect(pointAlongPath([dallas, memphis], 1e9)).toEqual(memphis)
  })

  it('returns the origin for an empty path', () => {
    expect(pointAlongPath([], 100)).toEqual({ lat: 0, lng: 0 })
  })
})

describe('simplifyPath', () => {
  it('collapses a straight line to its endpoints', () => {
    const path = [
      { lat: 0, lng: 0 },
      { lat: 0.001, lng: 0.002 },
      { lat: 0.002, lng: 0.004 },
      { lat: 0.003, lng: 0.006 },
    ]
    expect(simplifyPath(path, 10)).toEqual([path[0], path[3]])
  })

  it('keeps sharp corners that exceed the tolerance', () => {
    const path = [
      { lat: 0, lng: 0 },
      { lat: 0.01, lng: 0.01 },
      { lat: 0.02, lng: 0 },
      { lat: 0.03, lng: 0 },
    ]
    const out = simplifyPath(path, 10)
    expect(out[0]).toEqual(path[0])
    expect(out[out.length - 1]).toEqual(path[3])
    expect(out).toContain(path[2])
  })

  it('returns the input unchanged for ≤ 2 points', () => {
    const two = [dallas, memphis]
    expect(simplifyPath(two, 1)).toBe(two)
  })

  it('keeps a far outlier but drops points collinear with the split segments', () => {
    const p0 = { lat: 0, lng: 0 }
    const p1 = { lat: 0.01, lng: 0.02 }
    const p2 = { lat: 0.02, lng: 0.04 }
    const p3 = { lat: 0.025, lng: 0.025 }
    const p4 = { lat: 0.03, lng: 0.01 }
    const out = simplifyPath([p0, p1, p2, p3, p4], 10)
    expect(out).toEqual([p0, p2, p4])
  })
})
