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
  errorRate: number;
}

export class MetricsService {
  private totalRequests: number = 0;
  private totalErrors: number = 0;
  private totalLatency: number = 0;
  private minLatency: number = 0;
  private maxLatency: number = 0;
  private history: MetricPoint[] = [];

  recordRequest(duration: number, success: boolean): void {
    this.totalRequests++;
    this.totalLatency += duration;

    if (!success) {
      this.totalErrors++;
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
    const metrics = this.getMetrics();
    const point: MetricPoint = {
      timestamp: Date.now(),
      avgLatency: metrics.avgLatency,
      errorRate: metrics.errorRate,
    };

    this.history.push(point);
    if (this.history.length > 30) {
      this.history.shift();
    }
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
  }
}
