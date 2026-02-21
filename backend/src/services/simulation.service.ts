export class SimulationService {
  async simulateDelay(ms: number, jitter: number = 0): Promise<void> {
    let effectiveDelay = ms;

    if (jitter > 0) {
      const variation = Math.random() * jitter * 2 - jitter;
      effectiveDelay = Math.floor(ms + variation);
      effectiveDelay = Math.max(0, effectiveDelay);
    }

    if (ms < 0) {
      throw new Error('Internal Server Error simulated');
    }
    if (effectiveDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, effectiveDelay));
    }
  }

  simulateCpuLoad(loops: number): void {
    if (loops > 0) {
      let result = 0;
      for (let i = 0; i < loops; i++) {
        result += Math.sqrt(i) * Math.sqrt(i + 1);
      }
    }
  }

  simulateMemoryStress(mb: number): Buffer | null {
    if (mb > 0) {
      // Allocate buffer and fill with 'a' to ensure it's actually allocated (not just virtual)
      return Buffer.alloc(mb * 1024 * 1024, 'a');
    }
    return null;
  }
}
