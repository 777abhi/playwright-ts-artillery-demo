import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LoadTestingPanel from './LoadTestingPanel'
import '@testing-library/jest-dom'

describe('LoadTestingPanel', () => {
  it('triggers multiple requests based on concurrent users and iterations', () => {
    const onTrigger = vi.fn()
    render(<LoadTestingPanel onTrigger={onTrigger} loading={false} />)

    fireEvent.change(screen.getByLabelText(/Concurrent Users:/i), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText(/Iterations per User:/i), { target: { value: '3' } })

    fireEvent.click(screen.getByRole('button', { name: /Trigger Load Test/i }))

    expect(onTrigger).toHaveBeenCalledWith(2, 3)
  })

  it('disables the button when loading', () => {
    const onTrigger = vi.fn()
    render(<LoadTestingPanel onTrigger={onTrigger} loading={true} />)

    const button = screen.getByRole('button', { name: /Running Load Test.../i })
    expect(button).toBeDisabled()
  })
})
