import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntelligentSampler } from './intelligent-sampler.service';
import { DynamicRatioSampler } from './tracing.service';
import { SpanKind, Context, Attributes, Link } from '@opentelemetry/api';
import { SamplingDecision } from '@opentelemetry/sdk-trace-base';

describe('IntelligentSampler', () => {
  let dynamicSampler: DynamicRatioSampler;
  let intelligentSampler: IntelligentSampler;
  let mockContext: Context;

  beforeEach(() => {
    dynamicSampler = new DynamicRatioSampler(0.1);
    vi.spyOn(dynamicSampler, 'shouldSample').mockReturnValue({ decision: SamplingDecision.NOT_RECORD });
    intelligentSampler = new IntelligentSampler(dynamicSampler);
    mockContext = {} as Context;
  });

  const runSampler = (attributes: Attributes) => {
    return intelligentSampler.shouldSample(
      mockContext,
      'trace-id',
      'span-name',
      SpanKind.SERVER,
      attributes,
      []
    );
  };

  it('should delegate to underlying sampler when no attributes exist', () => {
    const result = runSampler({});
    expect(result.decision).toBe(SamplingDecision.NOT_RECORD);
    expect(dynamicSampler.shouldSample).toHaveBeenCalled();
  });

  it('should force RECORD_AND_SAMPLED when memoryStress is present', () => {
    const result = runSampler({ 'url.query': '?memoryStress=50' });
    expect(result.decision).toBe(SamplingDecision.RECORD_AND_SAMPLED);
    expect(dynamicSampler.shouldSample).not.toHaveBeenCalled();
  });

  it('should force RECORD_AND_SAMPLED when cpuLoad is present', () => {
    const result = runSampler({ 'url.path': '/process', 'url.query': '?cpuLoad=1000' });
    expect(result.decision).toBe(SamplingDecision.RECORD_AND_SAMPLED);
  });

  it('should force RECORD_AND_SAMPLED when delay is negative (service fail)', () => {
    const result = runSampler({ 'url.query': '?delay=-1' });
    expect(result.decision).toBe(SamplingDecision.RECORD_AND_SAMPLED);
  });

  it('should force RECORD_AND_SAMPLED when delay is >= 1000', () => {
    const result = runSampler({ 'url.query': '?delay=1500' });
    expect(result.decision).toBe(SamplingDecision.RECORD_AND_SAMPLED);
  });

  it('should force RECORD_AND_SAMPLED when jitter is present', () => {
    const result = runSampler({ 'url.query': '?jitter=500' });
    expect(result.decision).toBe(SamplingDecision.RECORD_AND_SAMPLED);
  });

  it('should delegate when delay is small and no other stress factors exist', () => {
    const result = runSampler({ 'url.query': '?delay=100' });
    expect(result.decision).toBe(SamplingDecision.NOT_RECORD);
    expect(dynamicSampler.shouldSample).toHaveBeenCalled();
  });

  it('should extract query string from full URL if url.query is missing', () => {
    const result = runSampler({ 'url.full': 'http://localhost:3000/process?memoryStress=10' });
    expect(result.decision).toBe(SamplingDecision.RECORD_AND_SAMPLED);
  });

  it('should support legacy http.url attribute', () => {
    const result = runSampler({ 'http.url': 'http://localhost:3000/process?cpuLoad=5000' });
    expect(result.decision).toBe(SamplingDecision.RECORD_AND_SAMPLED);
  });
});
