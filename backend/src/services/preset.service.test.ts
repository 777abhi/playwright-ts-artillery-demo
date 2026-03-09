import { describe, it, expect, vi } from 'vitest';
import { PresetService, InMemoryCache, ICacheProvider } from './preset.service';

describe('PresetService', () => {
  it('should return presets from cache if available', async () => {
    const mockCache: ICacheProvider<any> = {
      get: vi.fn().mockReturnValue({ 'MockPreset': { delay: 10, cpuLoad: 0, memoryStress: 0, jitter: 0 } }),
      set: vi.fn(),
      clear: vi.fn()
    };

    const service = new PresetService(mockCache);
    const presets = await service.getPresets();

    expect(mockCache.get).toHaveBeenCalledWith('presets');
    expect(presets).toHaveProperty('MockPreset');
    expect(presets['MockPreset'].delay).toBe(10);
  });

  it('should fetch and cache presets if cache is empty', async () => {
    const mockCache: ICacheProvider<any> = {
      get: vi.fn().mockReturnValue(null),
      set: vi.fn(),
      clear: vi.fn()
    };

    const service = new PresetService(mockCache);
    const presets = await service.getPresets();

    expect(mockCache.get).toHaveBeenCalledWith('presets');
    expect(mockCache.set).toHaveBeenCalledWith('presets', expect.any(Object), 3600000);
    expect(presets).toHaveProperty('Optimal');
    expect(presets).toHaveProperty('DB Latency');
  });
});

describe('InMemoryCache', () => {
  it('should store and retrieve values', () => {
    const cache = new InMemoryCache<string>();
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return null for missing keys', () => {
    const cache = new InMemoryCache<string>();
    expect(cache.get('missing')).toBeNull();
  });

  it('should clear all values', () => {
    const cache = new InMemoryCache<string>();
    cache.set('key1', 'value1');
    cache.clear();
    expect(cache.get('key1')).toBeNull();
  });
});
