import sqlite3 from 'sqlite3';
import { MetricPoint } from './metrics.service';
import { Anomaly } from './anomaly-detector.service';

export interface PersistedAnomaly extends Anomaly {
  timestamp: number;
}

export class DatabaseService {
  private db!: sqlite3.Database;
  private dbPath: string;

  constructor(dbPath: string = 'metrics.sqlite') {
    this.dbPath = dbPath;
  }

  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Failed to open database', err);
          reject(err);
          return;
        }

        this.db.serialize(() => {
          this.db.run(`
            CREATE TABLE IF NOT EXISTS metric_points (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              timestamp INTEGER NOT NULL,
              avgLatency REAL NOT NULL,
              p95Latency REAL NOT NULL,
              errorRate REAL NOT NULL,
              requests INTEGER NOT NULL
            )
          `);

          this.db.run(`
            CREATE TABLE IF NOT EXISTS anomalies (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              timestamp INTEGER NOT NULL,
              type TEXT NOT NULL,
              message TEXT NOT NULL
            )
          `, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  saveMetricPoint(point: MetricPoint): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(
        'INSERT INTO metric_points (timestamp, avgLatency, p95Latency, errorRate, requests) VALUES (?, ?, ?, ?, ?)'
      );
      stmt.run(
        point.timestamp,
        point.avgLatency,
        point.p95Latency,
        point.errorRate,
        point.requests,
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
      stmt.finalize();
    });
  }

  saveAnomaly(anomaly: Anomaly, timestamp: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(
        'INSERT INTO anomalies (timestamp, type, message) VALUES (?, ?, ?)'
      );
      stmt.run(
        timestamp,
        anomaly.type,
        anomaly.message,
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
      stmt.finalize();
    });
  }

  getHistoricalMetrics(startTime: number, endTime: number): Promise<MetricPoint[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT timestamp, avgLatency, p95Latency, errorRate, requests FROM metric_points WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC',
        [startTime, endTime],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  getHistoricalAnomalies(startTime: number, endTime: number): Promise<PersistedAnomaly[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT timestamp, type, message FROM anomalies WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC',
        [startTime, endTime],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }
}
