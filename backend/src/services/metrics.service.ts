import { TDigest } from 'tdigest';

export interface Metrics {
  totalRequests: number;
  totalErrors: number;
  totalLatency: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  errorRate: number;
}

export interface MetricPoint {
  timestamp: number;
  avgLatency: number;
  p95Latency: number;
  errorRate: number;
}

export class MetricsService {
  private totalRequests: number = 0;
  private totalErrors: number = 0;
  private totalLatency: number = 0;
  private minLatency: number = 0;
  private maxLatency: number = 0;
  private history: MetricPoint[] = [];

  // Interval metrics for windowed history
  private intervalRequests: number = 0;
  private intervalErrors: number = 0;
  private intervalLatency: number = 0;
  private intervalDigest: TDigest = new TDigest();

  recordRequest(duration: number, success: boolean): void {
    this.totalRequests++;
    this.totalLatency += duration;

    this.intervalRequests++;
    this.intervalLatency += duration;
    this.intervalDigest.push(duration);

    if (!success) {
      this.totalErrors++;
      this.intervalErrors++;
    }

    if (this.totalRequests === 1) {
      this.minLatency = duration;
      this.maxLatency = duration;
    } else {
      this.minLatency = Math.min(this.minLatency, duration);
      this.maxLatency = Math.max(this.maxLatency, duration);
    }
  }

  getMetrics(): Metrics {
    const avgLatency = this.totalRequests > 0 ? this.totalLatency / this.totalRequests : 0;
    const errorRate = this.totalRequests > 0 ? this.totalErrors / this.totalRequests : 0;

    return {
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      totalLatency: this.totalLatency,
      avgLatency,
      minLatency: this.minLatency,
      maxLatency: this.maxLatency,
      errorRate,
    };
  }

  snapshot(): void {
    const avgLatency = this.intervalRequests > 0 ? this.intervalLatency / this.intervalRequests : 0;
    const errorRate = this.intervalRequests > 0 ? this.intervalErrors / this.intervalRequests : 0;

    let p95Latency = 0;
    if (this.intervalRequests > 0) {
      p95Latency = this.intervalDigest.percentile(0.95) || 0;
    }

    const point: MetricPoint = {
      timestamp: Date.now(),
      avgLatency,
      p95Latency,
      errorRate,
    };

    this.history.push(point);
    if (this.history.length > 30) {
      this.history.shift();
    }

    // Reset interval metrics
    this.intervalRequests = 0;
    this.intervalErrors = 0;
    this.intervalLatency = 0;
    this.intervalDigest = new TDigest();
  }

  getHistory(): MetricPoint[] {
    return this.history;
  }

  reset(): void {
    this.totalRequests = 0;
    this.totalErrors = 0;
    this.totalLatency = 0;
    this.minLatency = 0;
    this.maxLatency = 0;
    this.history = [];
    this.intervalRequests = 0;
    this.intervalErrors = 0;
    this.intervalLatency = 0;
    this.intervalDigest = new TDigest();
  }
}
