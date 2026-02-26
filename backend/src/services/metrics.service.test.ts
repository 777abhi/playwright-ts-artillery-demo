import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  it('should initialize with zero values', () => {
    const metrics = service.getMetrics();
    expect(metrics).toEqual({
      totalRequests: 0,
      totalErrors: 0,
      totalLatency: 0,
      avgLatency: 0,
      minLatency: 0,
      maxLatency: 0,
      errorRate: 0,
    });
  });

  it('should record successful request', () => {
    service.recordRequest(100, true);
    const metrics = service.getMetrics();
    expect(metrics.totalRequests).toBe(1);
    expect(metrics.totalErrors).toBe(0);
    expect(metrics.totalLatency).toBe(100);
    expect(metrics.avgLatency).toBe(100);
    expect(metrics.minLatency).toBe(100);
    expect(metrics.maxLatency).toBe(100);
    expect(metrics.errorRate).toBe(0);
  });

  it('should record failed request', () => {
    service.recordRequest(50, false);
    const metrics = service.getMetrics();
    expect(metrics.totalRequests).toBe(1);
    expect(metrics.totalErrors).toBe(1);
    expect(metrics.totalLatency).toBe(50);
    expect(metrics.errorRate).toBe(1); // 100%
  });

  it('should calculate averages and rates correctly over multiple requests', () => {
    service.recordRequest(100, true);
    service.recordRequest(200, false);
    service.recordRequest(300, true);

    const metrics = service.getMetrics();
    expect(metrics.totalRequests).toBe(3);
    expect(metrics.totalErrors).toBe(1);
    expect(metrics.totalLatency).toBe(600);
    expect(metrics.avgLatency).toBe(200); // 600 / 3
    expect(metrics.minLatency).toBe(100);
    expect(metrics.maxLatency).toBe(300);
    expect(metrics.errorRate).toBeCloseTo(0.333, 3); // 1/3
  });

  it('should reset metrics', () => {
    service.recordRequest(100, true);
    service.reset();
    const metrics = service.getMetrics();
    expect(metrics.totalRequests).toBe(0);
  });

  it('should record snapshots in history', () => {
    service.recordRequest(100, true);

    service.snapshot();

    const history = service.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].avgLatency).toBe(100);
    expect(history[0].timestamp).toBeDefined();
  });

  it('should limit history to 30 items', () => {
    for (let i = 0; i < 35; i++) {
      service.recordRequest(100, true);
      service.snapshot();
    }
    const history = service.getHistory();
    expect(history.length).toBe(30);
  });

  it('should reset history', () => {
    service.recordRequest(100, true);
    service.snapshot();
    service.reset();
    const history = service.getHistory();
    expect(history.length).toBe(0);
  });

  it('should reflect interval metrics in history', () => {
    service.recordRequest(100, true);
    service.snapshot(); // History[0]: 100ms

    // In global metrics, if we add 300ms, avg becomes (100+300)/2 = 200ms.
    // In windowed metrics, it should be 300ms for the second interval.
    service.recordRequest(300, true);
    service.snapshot(); // History[1]: Should be 300ms

    const history = service.getHistory();
    expect(history.length).toBe(2);
    expect(history[0].avgLatency).toBe(100);
    expect(history[1].avgLatency).toBe(300);
  });
});
