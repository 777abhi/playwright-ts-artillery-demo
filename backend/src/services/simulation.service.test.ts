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

    it('should apply jitter to delay', async () => {
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

      await service.simulateDelay(100, 50);
      // random=0.5 => variation = 0.5 * 50 * 2 - 50 = 0 => delay = 100
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);

      randomSpy.mockReturnValue(0);
      // random=0 => variation = 0 * 100 - 50 = -50 => delay = 50
      await service.simulateDelay(100, 50);
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 50);

      randomSpy.mockReturnValue(0.999);
      // random~1 => variation = 0.999 * 100 - 50 = 49.9 => delay = 149
      await service.simulateDelay(100, 50);
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 149);

      randomSpy.mockRestore();
      setTimeoutSpy.mockRestore();
    });

    it('should apply jitter even when delay is 0', async () => {
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
      const randomSpy = vi.spyOn(Math, 'random');

      // Case 1: Positive jitter result
      randomSpy.mockReturnValue(0.75); // Variation = 0.75 * 50 * 2 - 50 = 25. Delay = 0 + 25 = 25.
      await service.simulateDelay(0, 50);
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 25);

      // Case 2: Negative jitter result (clamped to 0)
      setTimeoutSpy.mockClear();
      randomSpy.mockReturnValue(0.25); // Variation = -25. Delay = -25 => 0.
      await service.simulateDelay(0, 50);
      // Should not call setTimeout because effectiveDelay is 0
      expect(setTimeoutSpy).not.toHaveBeenCalled();

      randomSpy.mockRestore();
      setTimeoutSpy.mockRestore();
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
