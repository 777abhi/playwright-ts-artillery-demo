import { describe, it, expect } from 'vitest';
import { AiAnalysisService } from './ai-analysis.service';
import { MetricPoint } from './metrics.service';

describe('AiAnalysisService', () => {
  it('should recommend scaling CPU when average latency is high but error rate is low', () => {
    const service = new AiAnalysisService();
    const history: MetricPoint[] = [
      { timestamp: 1, avgLatency: 1500, p95Latency: 2000, errorRate: 0.01, requests: 100 },
      { timestamp: 2, avgLatency: 1600, p95Latency: 2100, errorRate: 0.01, requests: 100 }
    ];

    const recommendations = service.analyze(history);
    expect(recommendations).toContainEqual(
      expect.objectContaining({
        action: 'Scale up Compute Instances',
        type: 'scaling'
      })
    );
  });

  it('should recommend investigating external dependencies when there is a tail latency spike', () => {
    const service = new AiAnalysisService();
    const history: MetricPoint[] = [
      { timestamp: 1, avgLatency: 100, p95Latency: 3000, errorRate: 0, requests: 100 }
    ];

    const recommendations = service.analyze(history);
    expect(recommendations).toContainEqual(
      expect.objectContaining({
        action: 'Investigate DB or External API bottlenecks',
        type: 'optimization'
      })
    );
  });

  it('should recommend auto-remediation for high error rates', () => {
    const service = new AiAnalysisService();
    const history: MetricPoint[] = [
      { timestamp: 1, avgLatency: 50, p95Latency: 60, errorRate: 0.1, requests: 100 }
    ];

    const recommendations = service.analyze(history);
    expect(recommendations).toContainEqual(
      expect.objectContaining({
        action: 'Initiate Auto-Remediation: Restart Service',
        type: 'remediation'
      })
    );
  });

  it('should return no recommendations when metrics are optimal', () => {
    const service = new AiAnalysisService();
    const history: MetricPoint[] = [
      { timestamp: 1, avgLatency: 20, p95Latency: 30, errorRate: 0, requests: 100 }
    ];

    const recommendations = service.analyze(history);
    expect(recommendations.length).toBe(0);
  });
});
