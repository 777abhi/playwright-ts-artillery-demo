import { MetricPoint } from './metrics.service';

export interface Anomaly {
  type: 'LATENCY_SPIKE' | 'ERROR_RATE_SPIKE';
  message: string;
}

export class AnomalyDetectorService {
  private static MIN_HISTORY_LENGTH = 5;
  private static LATENCY_DEVIATION_THRESHOLD = 2.0; // 200% above moving average
  private static ERROR_RATE_THRESHOLD = 0.05; // 5% error rate
  private static MIN_LATENCY_BASELINE = 20; // 20ms minimum baseline

  detectAnomalies(history: MetricPoint[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    if (history.length < AnomalyDetectorService.MIN_HISTORY_LENGTH) {
      return anomalies;
    }

    const latestPoint = history[history.length - 1];

    if (latestPoint.errorRate > AnomalyDetectorService.ERROR_RATE_THRESHOLD) {
      anomalies.push({
        type: 'ERROR_RATE_SPIKE',
        message: `High error rate detected: ${(latestPoint.errorRate * 100).toFixed(1)}%`
      });
    }

    const baselinePoints = history.slice(0, history.length - 1);
    const averageLatencyBaseline = baselinePoints.reduce((sum, point) => sum + point.avgLatency, 0) / baselinePoints.length;
    const effectiveBaseline = Math.max(averageLatencyBaseline, AnomalyDetectorService.MIN_LATENCY_BASELINE);

    if (latestPoint.avgLatency > effectiveBaseline * AnomalyDetectorService.LATENCY_DEVIATION_THRESHOLD) {
      anomalies.push({
        type: 'LATENCY_SPIKE',
        message: `Latency deviation detected: ${latestPoint.avgLatency.toFixed(0)}ms (baseline: ${averageLatencyBaseline.toFixed(0)}ms)`
      });
    }

    return anomalies;
  }
}
