import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

const fastify: FastifyInstance = Fastify({ logger: true });

fastify.register(cors, {
  origin: '*'
});

interface ProcessQuery {
  delay?: string;
  cpuLoad?: string;
}

fastify.get<{ Querystring: ProcessQuery }>('/process', async (request, reply) => {
  const delay = parseInt(request.query.delay || '0') || 0;
  const cpuLoad = parseInt(request.query.cpuLoad || '0') || 0;

  // Service Fail Simulation
  if (delay < 0) {
    return reply.code(500).send({ error: 'Internal Server Error simulated' });
  }

  const startTime = Date.now();

  // Simulate CPU Load
  if (cpuLoad > 0) {
    let result = 0;
    for (let i = 0; i < cpuLoad; i++) {
      result += Math.sqrt(i) * Math.sqrt(i + 1);
    }
  }

  // Simulate Delay
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  const duration = Date.now() - startTime;

  return { success: true, delay, cpuLoad, duration };
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
