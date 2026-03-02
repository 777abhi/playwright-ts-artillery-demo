import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import WebSocket from 'ws';
import { buildApp } from './app';

describe('App Integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.listen({ port: 0 }); // Random port
  });

  afterAll(async () => {
    await app.close();
  });

  it('should expose prometheus metrics endpoint', async () => {
    // Make a request to ensure we record some duration metrics
    await app.inject({
      method: 'GET',
      url: '/process?delay=10'
    });

    const response = await app.inject({
      method: 'GET',
      url: '/metrics/prometheus'
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.body).toContain('http_request_duration_seconds');
    expect(response.body).toContain('process_cpu_user_seconds_total');
  });

  it('should stream metrics over WebSocket', async () => {
    const address = app.server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Server address not available');
    }

    const wsUrl = `ws://localhost:${address.port}/metrics/ws`;

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);

      // Trigger a request to generate some metrics
      app.inject({
        method: 'GET',
        url: '/process?delay=10'
      });

      ws.on('open', () => {
        // Wait for a message
      });

      ws.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          expect(parsed).toHaveProperty('totalRequests');
          expect(parsed).toHaveProperty('history');
          ws.close();
          resolve(undefined);
        } catch (e) {
          ws.close();
          reject(e);
        }
      });

      ws.on('error', (err) => {
        ws.close();
        reject(err);
      });

      // Timeout if no message is received
      setTimeout(() => {
        ws.close();
        reject(new Error('Timeout waiting for WebSocket message'));
      }, 3000);
    });
  });
});
