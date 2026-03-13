import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { trace } from '@opentelemetry/api';
import { AuthService } from './services/auth.service';
import { SimulationService } from './services/simulation.service';
import { MetricsService } from './services/metrics.service';
import { PrometheusService } from './services/prometheus.service';
import { PresetService } from './services/preset.service';
import { AutoSamplerService } from './services/auto-sampler.service';
import { AnomalyDetectorService } from './services/anomaly-detector.service';
import fastifyWebsocket from '@fastify/websocket';
import { dynamicSampler } from './tracing';

export function buildApp(): FastifyInstance {
  const fastify = Fastify({
    logger: {
      formatters: {
        log(object: any) {
          const span = trace.getActiveSpan();
          if (!span) return object;
          const { traceId, spanId } = span.spanContext();
          return { ...object, trace_id: traceId, span_id: spanId };
        }
      }
    }
  });
  const simulationService = new SimulationService();
  const metricsService = new MetricsService();
  const prometheusService = new PrometheusService();
  const presetService = new PresetService();
  const autoSamplerService = new AutoSamplerService();
  const authService = new AuthService();
  const anomalyDetectorService = new AnomalyDetectorService();

  fastify.register(cors, { origin: '*' });

  const requestStartTimes = new WeakMap<object, number>();

  fastify.addHook('onRequest', async (request, reply) => {
    requestStartTimes.set(request, Date.now());
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const startTime = requestStartTimes.get(request);
    if (startTime) {
      const duration = Date.now() - startTime;
      metricsService.recordRequest(duration, reply.statusCode < 400);

      const route = request.routeOptions.url || '404_not_found';
      prometheusService.recordRequestDuration(route, request.method, reply.statusCode, duration / 1000);
    }
  });

  let snapshotInterval: NodeJS.Timeout;

  fastify.register(fastifyWebsocket);

  fastify.addHook('onReady', async () => {
    snapshotInterval = setInterval(() => {
      metricsService.snapshot();

      const history = metricsService.getHistory();
      let anomalies: any[] = [];
      if (history.length > 0) {
        const latestPoint = history[history.length - 1];
        autoSamplerService.adjustRatio(dynamicSampler, latestPoint.requests);
        anomalies = anomalyDetectorService.detectAnomalies(history);
      }

      const metricsData = JSON.stringify({
        ...metricsService.getMetrics(),
        history,
        anomalies,
      });

      fastify.websocketServer.clients.forEach(client => {
        if (client.readyState === 1) { // 1 = OPEN
          client.send(metricsData);
        }
      });
    }, 2000);
  });

  fastify.register(async function (fastify) {
    fastify.get('/metrics/ws', { websocket: true }, (connection, req) => {
      const history = metricsService.getHistory();
      // Send initial state upon connection
      connection.socket.send(JSON.stringify({
        ...metricsService.getMetrics(),
        history,
        anomalies: anomalyDetectorService.detectAnomalies(history),
      }));
    });
  });

  fastify.addHook('onClose', async () => {
    if (snapshotInterval) {
      clearInterval(snapshotInterval);
    }
    prometheusService.stop();
  });

  fastify.get('/metrics', async () => {
    return {
      ...metricsService.getMetrics(),
      history: metricsService.getHistory(),
    };
  });

  fastify.delete('/metrics', async (request, reply) => {
    const apiKey = request.headers['x-api-key'] as string | undefined;
    const role = authService.getRole(apiKey);

    if (!authService.canResetMetrics(role)) {
      reply.code(403).send({ error: 'Forbidden: Insufficient permissions to reset metrics' });
      return;
    }

    metricsService.reset();
    return { success: true };
  });

  fastify.get('/metrics/prometheus', async (request, reply) => {
    const metrics = await prometheusService.getMetrics();
    reply.header('Content-Type', 'text/plain; version=0.0.4');
    return reply.send(metrics);
  });

  fastify.get('/presets', async (request, reply) => {
    return presetService.getPresets();
  });

  fastify.get('/settings/trace-ratio', async (request, reply) => {
    return { ratio: dynamicSampler.getRatio() };
  });

  interface PutTraceRatioBody {
    ratio: number;
  }

  fastify.put<{ Body: PutTraceRatioBody }>('/settings/trace-ratio', async (request, reply) => {
    const { ratio } = request.body;
    if (typeof ratio !== 'number' || ratio < 0 || ratio > 1) {
      return reply.code(400).send({ error: 'Ratio must be a number between 0 and 1' });
    }
    dynamicSampler.updateRatio(ratio);
    return { success: true, ratio: dynamicSampler.getRatio() };
  });

  interface ProcessQuery {
    delay?: string;
    cpuLoad?: string;
    memoryStress?: string;
    jitter?: string;
  }

  fastify.get<{ Querystring: ProcessQuery }>('/process', async (request, reply) => {
    const delay = parseInt(request.query.delay || '0') || 0;
    const cpuLoad = parseInt(request.query.cpuLoad || '0') || 0;
    const memoryStress = parseInt(request.query.memoryStress || '0') || 0;
    const jitter = parseInt(request.query.jitter || '0') || 0;

    const apiKey = request.headers['x-api-key'] as string | undefined;
    const role = authService.getRole(apiKey);

    if (!authService.canSimulate(role, { delay, memoryStress })) {
      reply.code(403).send({ error: 'Forbidden: Insufficient permissions for requested simulation parameters' });
      return;
    }

    try {
      if (delay < 0) {
        await simulationService.simulateDelay(delay, jitter);
      }

      const startTime = Date.now();
      const memoryBuffer = simulationService.simulateMemoryStress(memoryStress);
      simulationService.simulateCpuLoad(cpuLoad);

      if (delay > 0 || jitter > 0) {
        await simulationService.simulateDelay(delay, jitter);
      }

      const duration = Date.now() - startTime;
      return { success: true, delay, cpuLoad, memoryStress, jitter, duration };

    } catch (error) {
      if (error instanceof Error && error.message === 'Internal Server Error simulated') {
        return reply.code(500).send({ error: 'Internal Server Error simulated' });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  return fastify;
}
