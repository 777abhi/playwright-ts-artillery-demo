import { render } from '@testing-library/react'
import { describe, it } from 'vitest'
import MetricsChart from './MetricsChart'

describe('MetricsChart', () => {
  it('renders without crashing', () => {
    const mockData = [
        { timestamp: '12:00:00', avgLatency: 100, errorRate: 0.1 },
        { timestamp: '12:00:02', avgLatency: 120, errorRate: 0.0 }
    ]
    render(<MetricsChart data={mockData} />)
  })
})
