import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsService } from './metrics.service';

describe('MetricsService (Percentiles)', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  it('should calculate P95 latency in snapshot', () => {
    // Record 100 requests with latencies from 1 to 100
    for (let i = 1; i <= 100; i++) {
      service.recordRequest(i, true);
    }

    service.snapshot();

    const history = service.getHistory();
    expect(history.length).toBe(1);

    // The 95th percentile of 1..100 using T-Digest interpolation is approximately 95.5.
    // We expect it to be close to 95.5.
    expect(history[0]).toHaveProperty('p95Latency');
    expect((history[0] as any).p95Latency).toBeCloseTo(95.5, 0);
  });

  it('should handle P95 calculation with few requests', () => {
    service.recordRequest(10, true);
    service.recordRequest(100, true);

    service.snapshot();
    const history = service.getHistory();
    // 95th percentile of [10, 100] using T-Digest might be an interpolated value.
    expect((history[0] as any).p95Latency).toBeGreaterThanOrEqual(10);
    expect((history[0] as any).p95Latency).toBeLessThanOrEqual(100);
  });

  it('should handle P95 calculation with no requests', () => {
    service.snapshot();
    const history = service.getHistory();
    expect((history[0] as any).p95Latency).toBe(0);
  });
});
