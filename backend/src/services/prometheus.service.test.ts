import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrometheusService } from './prometheus.service';

describe('PrometheusService', () => {
  let prometheusService: PrometheusService;

  beforeEach(() => {
    prometheusService = new PrometheusService();
  });

  afterEach(() => {
    prometheusService.stop();
  });

  it('should initialize with default metrics', async () => {
    const metrics = await prometheusService.getMetrics();
    // process_cpu_user_seconds_total is a default metric exported by prom-client
    expect(metrics).toContain('process_cpu_user_seconds_total');
  });

  it('should record request duration', async () => {
    prometheusService.recordRequestDuration('/test', 'GET', 200, 0.150); // 150ms

    const metrics = await prometheusService.getMetrics();
    expect(metrics).toContain('http_request_duration_seconds');
    expect(metrics).toContain('route="/test"');
    expect(metrics).toContain('method="GET"');
    expect(metrics).toContain('status="200"');
    expect(metrics).toContain('0.15'); // the observed duration
  });

  it('should clear metrics registry', async () => {
    prometheusService.recordRequestDuration('/test', 'GET', 200, 0.150);
    prometheusService.clear();
    const metrics = await prometheusService.getMetrics();

    // Custom metrics should be cleared, we might need to be specific about what we check
    // If we just clear our custom histogram, the metric name shouldn't have any recorded data
    expect(metrics).not.toContain('route="/test"');
  });
});
