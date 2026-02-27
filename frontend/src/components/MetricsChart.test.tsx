import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom'
import MetricsChart from './MetricsChart'

// Fully Mock Recharts because verifying SVG rendering in JSDOM is flaky/hard.
// We only need to ensure that the component passes the correct data to Recharts components.
// OR, we can mock Recharts components to render simple HTML elements with their props as data attributes or text.

vi.mock('recharts', async () => {
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Line: ({ name, dataKey }: { name: string, dataKey: string }) => <div data-testid="line-item">{name} - {dataKey}</div>,
    XAxis: () => <div>XAxis</div>,
    YAxis: () => <div>YAxis</div>,
    CartesianGrid: () => <div>Grid</div>,
    Tooltip: () => <div>Tooltip</div>,
    Legend: () => <div>Legend</div>,
  };
});

describe('MetricsChart', () => {
  it('renders without crashing', () => {
    const mockData = [
        { timestamp: '12:00:00', avgLatency: 100, p95Latency: 150, errorRate: 0.1 },
        { timestamp: '12:00:02', avgLatency: 120, p95Latency: 180, errorRate: 0.0 }
    ]
    render(<MetricsChart data={mockData} />)
  })

  it('renders P95 Latency line configuration', async () => {
    const mockData = [
        { timestamp: '12:00:00', avgLatency: 100, p95Latency: 150, errorRate: 0.1 },
    ]
    render(<MetricsChart data={mockData} />)

    // Check if a "Line" component was rendered with name "P95 Latency"
    // Since we mocked Line to render text "{name} - {dataKey}", we can search for it.
    expect(await screen.findByText('P95 Latency - p95Latency')).toBeInTheDocument()
  })
});
