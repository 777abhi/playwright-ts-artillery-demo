import { describe, it, expect, vi } from 'vitest';
import { DynamicRatioSampler } from './tracing.service';
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';

describe('DynamicRatioSampler', () => {
  it('should initialize with a default ratio', () => {
    const sampler = new DynamicRatioSampler(0.5);
    expect(sampler.getRatio()).toBe(0.5);
  });

  it('should update the ratio', () => {
    const sampler = new DynamicRatioSampler(0.1);
    expect(sampler.getRatio()).toBe(0.1);

    sampler.updateRatio(0.9);
    expect(sampler.getRatio()).toBe(0.9);
  });

  it('should delegate shouldSample to the underlying sampler', () => {
    const sampler = new DynamicRatioSampler(1.0);
    const mockContext = {} as any;
    const mockTraceId = '12345678901234567890123456789012';
    const mockSpanName = 'test';
    const mockSpanKind = 0;
    const mockAttributes = {};
    const mockLinks: any[] = [];

    const result = sampler.shouldSample(mockContext, mockTraceId, mockSpanName, mockSpanKind, mockAttributes, mockLinks);

    // With ratio 1.0, it should always sample (result.decision === 1 means RECORD_AND_SAMPLED)
    // NOTE: In OpenTelemetry JS, RECORD_AND_SAMPLED is enum value 2, NOT_RECORD is 0, RECORD is 1
    // Actually from SamplingDecision enum:
    // NOT_RECORD = 0, RECORD = 1, RECORD_AND_SAMPLED = 2.
    expect(result.decision).toBe(2);
  });

  it('should create a new underlying sampler when ratio is updated', () => {
    const sampler = new DynamicRatioSampler(0.0);
    const mockContext = {} as any;
    const mockTraceId = '12345678901234567890123456789012';
    const mockSpanName = 'test';
    const mockSpanKind = 0;
    const mockAttributes = {};
    const mockLinks: any[] = [];

    // Ratio 0.0 -> should not sample (decision 0 means NOT_RECORD)
    let result = sampler.shouldSample(mockContext, mockTraceId, mockSpanName, mockSpanKind, mockAttributes, mockLinks);
    expect(result.decision).toBe(0);

    // Update to 1.0 -> should sample
    sampler.updateRatio(1.0);
    result = sampler.shouldSample(mockContext, mockTraceId, mockSpanName, mockSpanKind, mockAttributes, mockLinks);
    expect(result.decision).toBe(2);
  });
});
