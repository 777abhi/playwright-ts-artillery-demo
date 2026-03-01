import * as promClient from 'prom-client';

export class PrometheusService {
  private registry: promClient.Registry;
  private httpRequestDurationMicroseconds: promClient.Histogram<string>;

  constructor() {
    this.registry = new promClient.Registry();

    // Add default metrics (e.g., process_cpu_user_seconds_total)
    promClient.collectDefaultMetrics({ register: this.registry });

    // Define custom metrics
    this.httpRequestDurationMicroseconds = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5], // Define bucket sizes in seconds
      registers: [this.registry],
    });
  }

  recordRequestDuration(route: string, method: string, status: number, durationSeconds: number): void {
    this.httpRequestDurationMicroseconds.labels(method, route, status.toString()).observe(durationSeconds);
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  clear(): void {
    this.registry.clear();
  }

  stop(): void {
    this.registry.clear();
    promClient.register.clear(); // Clear global registry to stop background timers if any leaked
  }
}
