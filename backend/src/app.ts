import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { SimulationService } from './services/simulation.service';
import { MetricsService } from './services/metrics.service';
import fastifyWebsocket from '@fastify/websocket';

export function buildApp(): FastifyInstance {
  const fastify = Fastify({ logger: true });
  const simulationService = new SimulationService();
  const metricsService = new MetricsService();

  fastify.register(cors, { origin: '*' });

  const requestStartTimes = new WeakMap<object, number>();

  fastify.addHook('onRequest', async (request) => {
    requestStartTimes.set(request, Date.now());
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const startTime = requestStartTimes.get(request);
    if (startTime) {
      const duration = Date.now() - startTime;
      metricsService.recordRequest(duration, reply.statusCode < 400);
    }
  });

  let snapshotInterval: NodeJS.Timeout;

  fastify.register(fastifyWebsocket);

  fastify.addHook('onReady', async () => {
    snapshotInterval = setInterval(() => {
      metricsService.snapshot();

      const metricsData = JSON.stringify({
        ...metricsService.getMetrics(),
        history: metricsService.getHistory(),
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
      // Send initial state upon connection
      connection.socket.send(JSON.stringify({
        ...metricsService.getMetrics(),
        history: metricsService.getHistory(),
      }));
    });
  });

  fastify.addHook('onClose', async () => {
    if (snapshotInterval) {
      clearInterval(snapshotInterval);
    }
  });

  fastify.get('/metrics', async () => {
    return {
      ...metricsService.getMetrics(),
      history: metricsService.getHistory(),
    };
  });

  fastify.delete('/metrics', async () => {
    metricsService.reset();
    return { success: true };
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
