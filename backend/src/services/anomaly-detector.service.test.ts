import { describe, it, expect, beforeEach } from 'vitest';
import { AnomalyDetectorService } from './anomaly-detector.service';
import { MetricPoint } from './metrics.service';

describe('AnomalyDetectorService', () => {
  let detector: AnomalyDetectorService;

  beforeEach(() => {
    detector = new AnomalyDetectorService();
  });

  it('should return no anomalies for empty or short history', () => {
    const history: MetricPoint[] = [];
    expect(detector.detectAnomalies(history)).toEqual([]);

    const shortHistory = Array.from({ length: 4 }).map((_, i) => ({
      timestamp: Date.now() + i * 2000,
      avgLatency: 50,
      p95Latency: 70,
      errorRate: 0,
      requests: 10,
    }));
    // We need at least 5 points to establish a meaningful baseline
    expect(detector.detectAnomalies(shortHistory)).toEqual([]);
  });

  it('should detect latency spike compared to historical baseline', () => {
    // 5 normal points, then 1 spike
    const history: MetricPoint[] = Array.from({ length: 6 }).map((_, i) => ({
      timestamp: Date.now() + i * 2000,
      avgLatency: i === 5 ? 500 : 50, // Spike to 500ms on the latest point
      p95Latency: i === 5 ? 700 : 70,
      errorRate: 0,
      requests: 10,
    }));

    const anomalies = detector.detectAnomalies(history);
    expect(anomalies).toContainEqual(
      expect.objectContaining({
        type: 'LATENCY_SPIKE',
        message: expect.stringContaining('Latency deviation detected'),
      })
    );
  });

  it('should not trigger anomaly for normal fluctuations', () => {
    const history: MetricPoint[] = Array.from({ length: 10 }).map((_, i) => ({
      timestamp: Date.now() + i * 2000,
      avgLatency: 50 + Math.random() * 20, // 50-70 range
      p95Latency: 70,
      errorRate: 0,
      requests: 10,
    }));

    expect(detector.detectAnomalies(history)).toEqual([]);
  });

  it('should not trigger latency spike when baseline is 0 and current latency is small', () => {
    const history: MetricPoint[] = Array.from({ length: 6 }).map((_, i) => ({
      timestamp: Date.now() + i * 2000,
      avgLatency: i === 5 ? 5 : 0, // Spike to 5ms on a 0ms baseline
      p95Latency: 0,
      errorRate: 0,
      requests: i === 5 ? 1 : 0,
    }));

    expect(detector.detectAnomalies(history)).toEqual([]);
  });

  it('should detect error rate anomaly', () => {
    const history: MetricPoint[] = Array.from({ length: 6 }).map((_, i) => ({
      timestamp: Date.now() + i * 2000,
      avgLatency: 50,
      p95Latency: 70,
      errorRate: i === 5 ? 0.5 : 0.01, // Jump from 1% to 50% errors
      requests: 10,
    }));

    const anomalies = detector.detectAnomalies(history);
    expect(anomalies).toContainEqual(
      expect.objectContaining({
        type: 'ERROR_RATE_SPIKE',
        message: expect.stringContaining('High error rate detected'),
      })
    );
  });
});
