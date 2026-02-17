export class SimulationService {
  async simulateDelay(ms: number): Promise<void> {
    if (ms < 0) {
      throw new Error('Internal Server Error simulated');
    }
    if (ms > 0) {
      await new Promise(resolve => setTimeout(resolve, ms));
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
