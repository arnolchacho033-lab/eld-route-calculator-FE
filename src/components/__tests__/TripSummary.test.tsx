import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import TripSummary from '../TripSummary'
import { mkLog, mkTrip } from '../../test/fixtures'

describe('TripSummary', () => {
  it('renders all six summary stats', () => {
    const trip = mkTrip({ days: [mkLog(1), mkLog(2)], daysCount: 2 })
    render(<TripSummary trip={trip} />)
    expect(screen.getByText(/880 mi/)).toBeInTheDocument()
    expect(screen.getByText('32h 54m')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('57 mph')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('Total miles')).toBeInTheDocument()
    expect(screen.getByText('Drive time')).toBeInTheDocument()
    expect(screen.getByText('Trip days')).toBeInTheDocument()
    expect(screen.getByText('Avg speed')).toBeInTheDocument()
    expect(screen.getByText('Fuel stops')).toBeInTheDocument()
    expect(screen.getByText('Rest breaks')).toBeInTheDocument()
  })
})
