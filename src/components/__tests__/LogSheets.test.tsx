import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import LogSheets from '../LogSheets'
import { mkLog, mkTrip } from '../../test/fixtures'

describe('LogSheets', () => {
  it('shows day 1 and hides day 2 by default', () => {
    const { container } = render(<LogSheets trip={mkTrip({ days: [mkLog(1), mkLog(2)], daysCount: 2 })} />)
    const wraps = container.querySelectorAll('.log-sheet-wrap')
    expect(wraps).toHaveLength(2)
    expect(wraps[0].className).not.toContain('is-hidden')
    expect(wraps[1].className).toContain('is-hidden')
    expect(screen.getByText('Print logs')).toBeInTheDocument()
  })

  it('switches the visible sheet when a day tab is clicked', () => {
    const { container } = render(<LogSheets trip={mkTrip({ days: [mkLog(1), mkLog(2)], daysCount: 2 })} />)
    fireEvent.click(screen.getByRole('button', { name: /Day 2/ }))
    const wraps = container.querySelectorAll('.log-sheet-wrap')
    expect(wraps[0].className).toContain('is-hidden')
    expect(wraps[1].className).not.toContain('is-hidden')
  })
})
