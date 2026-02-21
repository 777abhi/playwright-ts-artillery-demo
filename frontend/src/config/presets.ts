export interface Config {
  delay: number;
  cpuLoad: number;
  memoryStress: number;
  jitter: number;
}

export const PRESETS: Record<string, Config> = {
  'Optimal': { delay: 0, cpuLoad: 0, memoryStress: 0, jitter: 0 },
  'DB Latency': { delay: 1500, cpuLoad: 0, memoryStress: 0, jitter: 0 },
  'CPU Bound': { delay: 100, cpuLoad: 10000000, memoryStress: 0, jitter: 0 },
  'Memory Stress': { delay: 0, cpuLoad: 0, memoryStress: 50, jitter: 0 },
  'Service Fail': { delay: -1, cpuLoad: 0, memoryStress: 0, jitter: 0 },
  'Network Jitter': { delay: 1000, cpuLoad: 0, memoryStress: 0, jitter: 500 },
};
