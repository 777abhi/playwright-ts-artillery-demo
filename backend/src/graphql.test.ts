import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from './app';

vi.mock('@opentelemetry/api', () => ({
  trace: {
    getActiveSpan: vi.fn(() => ({
      spanContext: () => ({
        traceId: 'mock-trace-id',
        spanId: 'mock-span-id',
      })
    }))
  }
}));

describe('GraphQL Endpoint', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp(':memory:');
    await app.listen({ port: 0 });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should fetch traceRatio via GraphQL', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: `
          query {
            traceRatio
          }
        `
      }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data).toHaveProperty('traceRatio');
    expect(typeof body.data.traceRatio).toBe('number');
  });

  it('should fetch presets via GraphQL', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: `
          query {
            presets {
              name
              preset {
                delay
              }
            }
          }
        `
      }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.presets.length).toBeGreaterThan(0);
    expect(body.data.presets[0].name).toBeDefined();
  });

  it('should fetch metrics via GraphQL', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: `
          query {
            metrics {
              totalRequests
              errorRate
              history {
                timestamp
                requests
              }
            }
          }
        `
      }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.metrics.totalRequests).toBeDefined();
    expect(Array.isArray(body.data.metrics.history)).toBe(true);
  });

  it('should fetch longTermMetrics via GraphQL', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: `
          query {
            longTermMetrics {
              metrics {
                timestamp
              }
              anomalies {
                message
              }
            }
          }
        `
      }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body.data.longTermMetrics.metrics)).toBe(true);
    expect(Array.isArray(body.data.longTermMetrics.anomalies)).toBe(true);
  });
});
