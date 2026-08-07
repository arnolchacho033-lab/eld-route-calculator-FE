import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import LogSheet from '../LogSheet'
import { mkLog } from '../../test/fixtures'

describe('LogSheet', () => {
  it('renders header fields (title, date, odometer)', () => {
    render(<LogSheet log={mkLog(1)} />)
    expect(screen.getByText(/Driver.s Daily Log/)).toBeInTheDocument()
    expect(screen.getAllByText('Day 1').length).toBeGreaterThan(0)
    expect(screen.getByText('08/07/2026')).toBeInTheDocument()
    expect(screen.getByText(/100[.,]000 → 100[.,]400/)).toBeInTheDocument()
  })

  it('draws a duty-line path inside the SVG grid', () => {
    const { container } = render(<LogSheet log={mkLog(1)} />)
    const path = container.querySelector('.log-svg path')
    expect(path).toBeTruthy()
    expect(path!.getAttribute('d')).toContain('M44.00')
  })

  it('renders one remark row per event', () => {
    const { container } = render(<LogSheet log={mkLog(1)} />)
    expect(container.querySelectorAll('.remark-table tr')).toHaveLength(4)
    expect(screen.getByText('Pre-trip inspection')).toBeInTheDocument()
    expect(screen.getAllByText('Memphis, TN').length).toBeGreaterThan(0)
  })

  it('shows 24:00 in the status totals row', () => {
    render(<LogSheet log={mkLog(1)} />)
    expect(screen.getByText('24:00')).toBeInTheDocument()
  })
})
