import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import StopsTimeline from '../StopsTimeline'
import { mkTrip } from '../../test/fixtures'

describe('StopsTimeline', () => {
  it('renders every stop with label, location, mile and time', () => {
    render(<StopsTimeline trip={mkTrip()} />)
    expect(screen.getByText('Fuel stop')).toBeInTheDocument()
    expect(screen.getByText('Mile ~1000 · mile 1000')).toBeInTheDocument()
    expect(screen.getByText('10:30')).toBeInTheDocument()
  })

  it('uses a fallback dot for unknown stop kinds', () => {
    const trip = mkTrip({ stops: [{ kind: 'pickup', label: 'Pickup', time: '13:11', location: 'Memphis, TN', coord: { lat: 35.1, lng: -90.0 }, cumMiles: 453 }] })
    const { container } = render(<StopsTimeline trip={trip} />)
    expect(screen.getByText('Pickup')).toBeInTheDocument()
    expect(screen.getByText('Memphis, TN · mile 453')).toBeInTheDocument()
    expect(container.querySelector('.stop-item--pickup')).toBeTruthy()
  })
})
