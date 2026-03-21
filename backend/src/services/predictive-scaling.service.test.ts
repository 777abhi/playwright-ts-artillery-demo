import { describe, it, expect } from 'vitest';
import { PredictiveScalingService } from './predictive-scaling.service';
import { MetricPoint } from './metrics.service';

describe('PredictiveScalingService', () => {
  it('should recommend scaling when detecting a sharp upward trend in requests', () => {
    const service = new PredictiveScalingService();
    const history: MetricPoint[] = [
      { timestamp: 1000, requests: 10, avgLatency: 50, p95Latency: 60, errorRate: 0 },
      { timestamp: 2000, requests: 12, avgLatency: 50, p95Latency: 60, errorRate: 0 },
      { timestamp: 3000, requests: 50, avgLatency: 55, p95Latency: 70, errorRate: 0 },
      { timestamp: 4000, requests: 150, avgLatency: 60, p95Latency: 80, errorRate: 0 },
      { timestamp: 5000, requests: 500, avgLatency: 80, p95Latency: 100, errorRate: 0.01 },
    ];

    const recommendation = service.analyze(history);

    expect(recommendation).toBeDefined();
    expect(recommendation?.action).toBe('Pre-provision Compute Resources');
    expect(recommendation?.type).toBe('scaling');
    expect(recommendation?.confidence).toBeGreaterThan(0.8);
  });

  it('should not recommend scaling for stable or downward trends', () => {
    const service = new PredictiveScalingService();
    const history: MetricPoint[] = [
      { timestamp: 1000, requests: 100, avgLatency: 50, p95Latency: 60, errorRate: 0 },
      { timestamp: 2000, requests: 90, avgLatency: 50, p95Latency: 60, errorRate: 0 },
      { timestamp: 3000, requests: 110, avgLatency: 55, p95Latency: 70, errorRate: 0 },
      { timestamp: 4000, requests: 105, avgLatency: 60, p95Latency: 80, errorRate: 0 },
      { timestamp: 5000, requests: 95, avgLatency: 80, p95Latency: 100, errorRate: 0 },
    ];

    const recommendation = service.analyze(history);

    expect(recommendation).toBeNull();
  });
});
