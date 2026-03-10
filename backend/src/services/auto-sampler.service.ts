import { DynamicRatioSampler } from './tracing.service';

export class AutoSamplerService {
  private readonly LOW_LOAD_THRESHOLD = 5; // e.g. 5 requests per interval
  private readonly HIGH_LOAD_THRESHOLD = 20; // e.g. 20 requests per interval
  private readonly MIN_RATIO = 0.01;
  private readonly MAX_RATIO = 1.0;
  private readonly ADJUSTMENT_STEP = 0.05;

  adjustRatio(dynamicSampler: DynamicRatioSampler, currentRequests: number): void {
    const currentRatio = dynamicSampler.getRatio();
    let newRatio = currentRatio;

    if (currentRequests > this.HIGH_LOAD_THRESHOLD) {
      newRatio = currentRatio - this.ADJUSTMENT_STEP;
    } else if (currentRequests < this.LOW_LOAD_THRESHOLD) {
      newRatio = currentRatio + this.ADJUSTMENT_STEP;
    }

    // Clamp between MIN_RATIO and MAX_RATIO
    newRatio = Math.max(this.MIN_RATIO, Math.min(this.MAX_RATIO, newRatio));

    // Due to floating point math, let's round it up to two decimal places to keep it clean
    newRatio = Math.round(newRatio * 100) / 100;

    if (newRatio !== currentRatio) {
      dynamicSampler.updateRatio(newRatio);
    }
  }
}