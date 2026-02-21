import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { SimulationService } from './src/services/simulation.service';

const fastify: FastifyInstance = Fastify({ logger: true });
const simulationService = new SimulationService();

fastify.register(cors, {
  origin: '*'
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
    // Service Fail Simulation: Fail fast if delay is negative
    if (delay < 0) {
      await simulationService.simulateDelay(delay, jitter);
    }

    const startTime = Date.now();

    // Simulate Memory Stress
    // We hold the reference to the buffer to prevent GC during the request
    const memoryBuffer = simulationService.simulateMemoryStress(memoryStress);

    // Simulate CPU Load
    simulationService.simulateCpuLoad(cpuLoad);

    // Simulate Delay (only if positive delay or jitter)
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

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
