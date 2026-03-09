export interface Config {
  delay: number;
  cpuLoad: number;
  memoryStress: number;
  jitter: number;
}

export interface ICacheProvider<T> {
  get(key: string): T | null;
  set(key: string, value: T, ttlMs?: number): void;
  clear(): void;
}

export class InMemoryCache<T> implements ICacheProvider<T> {
  private cache: Map<string, { value: T; expiresAt: number | null }> = new Map();

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }
    if (item.expiresAt !== null && Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = ttlMs ? Date.now() + ttlMs : null;
    this.cache.set(key, { value, expiresAt });
  }

  clear(): void {
    this.cache.clear();
  }
}

export class PresetService {
  private cacheProvider: ICacheProvider<Record<string, Config>>;
  private readonly CACHE_KEY = 'presets';

  constructor(cacheProvider: ICacheProvider<Record<string, Config>> = new InMemoryCache()) {
    this.cacheProvider = cacheProvider;
  }

  async getPresets(): Promise<Record<string, Config>> {
    const cachedPresets = this.cacheProvider.get(this.CACHE_KEY);
    if (cachedPresets) {
      return cachedPresets;
    }

    // Simulate fetching from a database or external source
    const defaultPresets: Record<string, Config> = {
      'Optimal': { delay: 0, cpuLoad: 0, memoryStress: 0, jitter: 0 },
      'DB Latency': { delay: 1500, cpuLoad: 0, memoryStress: 0, jitter: 0 },
      'CPU Bound': { delay: 100, cpuLoad: 10000000, memoryStress: 0, jitter: 0 },
      'Memory Stress': { delay: 0, cpuLoad: 0, memoryStress: 50, jitter: 0 },
      'Service Fail': { delay: -1, cpuLoad: 0, memoryStress: 0, jitter: 0 },
      'Network Jitter': { delay: 1000, cpuLoad: 0, memoryStress: 0, jitter: 500 },
    };

    // Cache the presets (e.g., for 1 hour)
    this.cacheProvider.set(this.CACHE_KEY, defaultPresets, 3600000);

    return defaultPresets;
  }
}
