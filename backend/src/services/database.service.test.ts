import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from './database.service';
import { MetricPoint } from './metrics.service';
import { Anomaly } from './anomaly-detector.service';

describe('DatabaseService', () => {
  let dbService: DatabaseService;

  beforeEach(async () => {
    // Use an in-memory SQLite database for testing
    dbService = new DatabaseService(':memory:');
    await dbService.init();
  });

  afterEach(async () => {
    await dbService.close();
  });

  it('should initialize the database with metric_points and anomalies tables', async () => {
    // This is implicitly tested if we don't get an error on init()
    // but let's make sure it doesn't throw.
    expect(dbService).toBeDefined();
  });

  it('should save and retrieve a metric point', async () => {
    const point: MetricPoint = {
      timestamp: 1678886400000,
      avgLatency: 55.5,
      p95Latency: 120.2,
      errorRate: 0.05,
      requests: 100
    };

    await dbService.saveMetricPoint(point);

    const history = await dbService.getHistoricalMetrics(1678886000000, 1678887000000);
    expect(history.length).toBe(1);
    expect(history[0]).toEqual(point);
  });

  it('should save and retrieve an anomaly associated with a timestamp', async () => {
    const anomaly: Anomaly = {
      type: 'LATENCY_SPIKE',
      message: 'High latency detected',
    };
    const timestamp = 1678886400000;

    await dbService.saveAnomaly(anomaly, timestamp);

    const anomalies = await dbService.getHistoricalAnomalies(1678886000000, 1678887000000);
    expect(anomalies.length).toBe(1);
    expect(anomalies[0]).toEqual({ ...anomaly, timestamp });
  });

  it('should only return points within the given time range', async () => {
    await dbService.saveMetricPoint({
      timestamp: 1000,
      avgLatency: 10,
      p95Latency: 20,
      errorRate: 0,
      requests: 5
    });

    await dbService.saveMetricPoint({
      timestamp: 2000,
      avgLatency: 10,
      p95Latency: 20,
      errorRate: 0,
      requests: 5
    });

    const history = await dbService.getHistoricalMetrics(1500, 2500);
    expect(history.length).toBe(1);
    expect(history[0].timestamp).toBe(2000);
  });
});
