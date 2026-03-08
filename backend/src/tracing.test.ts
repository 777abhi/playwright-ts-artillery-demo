import { describe, it, expect, vi } from 'vitest';

// Mock the open telemetry modules before importing tracing
vi.mock('@opentelemetry/sdk-node', () => {
  const NodeSDKMock = vi.fn();
  NodeSDKMock.prototype.start = vi.fn();
  NodeSDKMock.prototype.shutdown = vi.fn().mockResolvedValue(undefined);
  return {
    NodeSDK: NodeSDKMock,
  };
});

vi.mock('@opentelemetry/auto-instrumentations-node', () => ({
  getNodeAutoInstrumentations: vi.fn().mockReturnValue([]),
}));

vi.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: vi.fn(),
}));

vi.mock('@opentelemetry/resources', () => {
  return {
    resourceFromAttributes: vi.fn(),
  };
});

vi.mock('@opentelemetry/sdk-trace-base', () => {
  return {
    ParentBasedSampler: vi.fn(),
    TraceIdRatioBasedSampler: vi.fn(),
  };
});

describe('Tracing Setup', () => {
  it('should initialize OpenTelemetry NodeSDK on import', async () => {
    // Import the tracing module
    const { sdk } = await import('./tracing');

    // Verify the SDK was started
    expect(sdk.start).toHaveBeenCalled();
  });

  it('should configure OTLPTraceExporter', async () => {
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
    await import('./tracing');

    expect(OTLPTraceExporter).toHaveBeenCalled();
  });

  it('should configure a ParentBasedSampler with a DynamicRatioSampler', async () => {
    const { ParentBasedSampler } = await import('@opentelemetry/sdk-trace-base');
    const { NodeSDK } = await import('@opentelemetry/sdk-node');

    await import('./tracing');

    expect(ParentBasedSampler).toHaveBeenCalled();
    expect(NodeSDK).toHaveBeenCalledWith(expect.objectContaining({
      sampler: expect.any(Object)
    }));
  });
});
