import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import TripForm from '../TripForm'

describe('TripForm', () => {
  it('submits trimmed inputs and a numeric cycle value', () => {
    const onPlan = vi.fn()
    render(<TripForm busy={false} onPlan={onPlan} />)
    fireEvent.change(screen.getByLabelText('Current location'), { target: { value: '  Dallas, TX  ' } })
    fireEvent.change(screen.getByLabelText('Pickup location'), { target: { value: 'Memphis, TN' } })
    fireEvent.change(screen.getByLabelText('Dropoff location'), { target: { value: 'Phoenix, AZ' } })
    fireEvent.change(screen.getByLabelText('Current cycle used (hrs)'), { target: { value: '22.5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Calculate route' }))
    expect(onPlan).toHaveBeenCalledWith({
      origin: 'Dallas, TX',
      pickup: 'Memphis, TN',
      dropoff: 'Phoenix, AZ',
      cycleUsed: 22.5,
    })
  })

  it('falls back to 0 when the cycle field is empty', () => {
    const onPlan = vi.fn()
    render(<TripForm busy={false} onPlan={onPlan} />)
    fireEvent.change(screen.getByLabelText('Current location'), { target: { value: 'A' } })
    fireEvent.change(screen.getByLabelText('Pickup location'), { target: { value: 'B' } })
    fireEvent.change(screen.getByLabelText('Dropoff location'), { target: { value: 'C' } })
    fireEvent.click(screen.getByRole('button', { name: 'Calculate route' }))
    expect(onPlan).toHaveBeenCalledWith({ origin: 'A', pickup: 'B', dropoff: 'C', cycleUsed: 0 })
  })

  it('disables the submit button while busy', () => {
    render(<TripForm busy onPlan={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Planning…' })).toBeDisabled()
  })
})
