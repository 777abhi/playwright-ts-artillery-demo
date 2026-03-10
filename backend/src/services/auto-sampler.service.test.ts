import { describe, it, expect } from 'vitest';
import { AutoSamplerService } from './auto-sampler.service';
import { DynamicRatioSampler } from './tracing.service';

describe('AutoSamplerService', () => {
  it('should decrease trace ratio under high load', () => {
    const dynamicSampler = new DynamicRatioSampler(0.5);
    const autoSampler = new AutoSamplerService();

    autoSampler.adjustRatio(dynamicSampler, 50); // 50 requests in 2 seconds = 25 req/sec (high load)

    expect(dynamicSampler.getRatio()).toBeLessThan(0.5);
  });

  it('should increase trace ratio under low load', () => {
    const dynamicSampler = new DynamicRatioSampler(0.5);
    const autoSampler = new AutoSamplerService();

    autoSampler.adjustRatio(dynamicSampler, 1); // 1 request in 2 seconds (low load)

    expect(dynamicSampler.getRatio()).toBeGreaterThan(0.5);
  });

  it('should not exceed boundaries 0.01 and 1.0', () => {
    const dynamicSampler = new DynamicRatioSampler(0.01);
    const autoSampler = new AutoSamplerService();

    autoSampler.adjustRatio(dynamicSampler, 100);

    expect(dynamicSampler.getRatio()).toBe(0.01);

    const dynamicSampler2 = new DynamicRatioSampler(1.0);
    autoSampler.adjustRatio(dynamicSampler2, 0);

    expect(dynamicSampler2.getRatio()).toBe(1.0);
  });
});
