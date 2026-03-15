import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom'
import LongTermMetrics from './LongTermMetrics'

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

describe('LongTermMetrics', () => {
  it('fetches and displays long-term metrics', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        metrics: [{ timestamp: 1700000000000, avgLatency: 100, p95Latency: 150, errorRate: 0.1, requests: 5 }],
        anomalies: []
      })
    });

    render(<LongTermMetrics apiBaseUrl="http://localhost:3001" />)

    fireEvent.click(screen.getByText('Fetch History'))

    await waitFor(() => {
      expect(screen.getByText('Avg Latency - avgLatency')).toBeInTheDocument()
    })
  })
});
