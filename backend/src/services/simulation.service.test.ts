import { describe, it, expect, vi } from 'vitest';
import { SimulationService } from './simulation.service';

describe('SimulationService', () => {
  const service = new SimulationService();

  describe('simulateMemoryStress', () => {
    it('should allocate buffer of correct size when mb > 0', () => {
      const allocSpy = vi.spyOn(Buffer, 'alloc');
      const result = service.simulateMemoryStress(10);
      expect(allocSpy).toHaveBeenCalledWith(10 * 1024 * 1024, 'a');
      expect(result).toBeInstanceOf(Buffer);
      expect(result?.length).toBe(10 * 1024 * 1024);
      allocSpy.mockRestore();
    });

    it('should return null when mb <= 0', () => {
      const result = service.simulateMemoryStress(0);
      expect(result).toBeNull();
    });
  });

  describe('simulateDelay', () => {
    it('should throw error when delay < 0', async () => {
      await expect(service.simulateDelay(-1)).rejects.toThrow('Internal Server Error simulated');
    });

    it('should resolve when delay > 0', async () => {
      const start = Date.now();
      await service.simulateDelay(100); // 100ms
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });

    it('should resolve immediately when delay is 0', async () => {
       const start = Date.now();
       await service.simulateDelay(0);
       const end = Date.now();
       expect(end - start).toBeLessThan(50);
    });
  });

  describe('simulateCpuLoad', () => {
      it('should run cpu load loop', () => {
          // Hard to test CPU load directly without timing, but we can check it doesn't crash
          // and maybe runs for non-zero time if loops is large
          const start = Date.now();
          service.simulateCpuLoad(1000000); // 1M loops
          const end = Date.now();
          expect(end - start).toBeGreaterThanOrEqual(0);
      });
  });
});
