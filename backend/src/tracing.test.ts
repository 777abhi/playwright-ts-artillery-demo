import { describe, it, expect, vi } from 'vitest';

// Mock the open telemetry modules before importing tracing
vi.mock('@opentelemetry/sdk-node', () => {
  return {
    NodeSDK: class {
      start = vi.fn();
      shutdown = vi.fn().mockResolvedValue(undefined);
    },
  };
});

vi.mock('@opentelemetry/auto-instrumentations-node', () => ({
  getNodeAutoInstrumentations: vi.fn().mockReturnValue([]),
}));

vi.mock('@opentelemetry/sdk-trace-node', () => ({
  ConsoleSpanExporter: vi.fn(),
}));

vi.mock('@opentelemetry/resources', () => {
  return {
    resourceFromAttributes: vi.fn(),
  };
});

describe('Tracing Setup', () => {
  it('should initialize OpenTelemetry NodeSDK on import', async () => {
    // Import the tracing module
    const { sdk } = await import('./tracing');

    // Verify the SDK was started
    expect(sdk.start).toHaveBeenCalled();
  });
});
