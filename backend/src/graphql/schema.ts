import { FastifyInstance } from 'fastify';
import { dynamicSampler } from '../tracing';
import { MetricsService } from '../services/metrics.service';
import { PresetService } from '../services/preset.service';
import { DatabaseService } from '../services/database.service';
import { AnomalyDetectorService } from '../services/anomaly-detector.service';
import { AiAnalysisService } from '../services/ai-analysis.service';
import { PredictiveScalingService } from '../services/predictive-scaling.service';

export const schema = `
  type PresetConfig {
    delay: Int!
    cpuLoad: Int!
    memoryStress: Int!
    jitter: Int!
  }

  type Preset {
    name: String!
    preset: PresetConfig!
  }

  type MetricHistoryPoint {
    timestamp: Float!
    avgLatency: Float!
    p95Latency: Float!
    errorRate: Float!
    requests: Int!
  }

  type Metrics {
    totalRequests: Int!
    totalErrors: Int!
    totalLatency: Float!
    avgLatency: Float!
    minLatency: Float!
    maxLatency: Float!
    errorRate: Float!
    history: [MetricHistoryPoint!]!
  }

  type Anomaly {
    message: String!
    type: String!
    timestamp: Float!
  }

  type LongTermMetrics {
    metrics: [MetricHistoryPoint!]!
    anomalies: [Anomaly!]!
  }

  type AiRecommendation {
    action: String!
    type: String!
    confidence: Float!
    reason: String!
  }

  type Query {
    traceRatio: Float!
    presets: [Preset!]!
    metrics: Metrics!
    longTermMetrics(startTime: Float, endTime: Float): LongTermMetrics!
    aiRecommendations: [AiRecommendation!]!
  }
`;

export function buildResolvers(
  metricsService: MetricsService,
  presetService: PresetService,
  databaseService: DatabaseService,
  anomalyDetectorService: AnomalyDetectorService,
  aiAnalysisService: AiAnalysisService,
  predictiveScalingService: PredictiveScalingService
) {
  return {
    Query: {
      traceRatio: () => {
        return dynamicSampler.getRatio();
      },
      presets: async () => {
        const presetsMap = await presetService.getPresets();
        return Object.entries(presetsMap).map(([name, preset]) => ({
          name,
          preset
        }));
      },
      metrics: () => {
        const history = metricsService.getHistory();
        return {
          ...metricsService.getMetrics(),
          history
        };
      },
      longTermMetrics: async (_: any, args: { startTime?: number; endTime?: number }, ctx: any) => {
        const defaultEndTime = Date.now();
        const defaultStartTime = defaultEndTime - 24 * 60 * 60 * 1000; // Last 24 hours

        const startTime = args.startTime || defaultStartTime;
        const endTime = args.endTime || defaultEndTime;

        const metrics = await databaseService.getHistoricalMetrics(startTime, endTime);
        const anomalies = await databaseService.getHistoricalAnomalies(startTime, endTime);

        return {
          metrics,
          anomalies
        };
      },
      aiRecommendations: () => {
        const history = metricsService.getHistory();
        const recommendations = [...aiAnalysisService.analyze(history)];
        const predictiveRec = predictiveScalingService.analyze(history);
        if (predictiveRec) {
          recommendations.push(predictiveRec);
        }
        return recommendations;
      }
    }
  };
}
