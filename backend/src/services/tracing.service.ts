import { Sampler, SamplingResult, Context, SpanKind, Attributes, Link } from '@opentelemetry/api';
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';

export class DynamicRatioSampler implements Sampler {
  private ratio: number;
  private underlyingSampler: TraceIdRatioBasedSampler;

  constructor(initialRatio: number) {
    this.ratio = initialRatio;
    this.underlyingSampler = new TraceIdRatioBasedSampler(this.ratio);
  }

  getRatio(): number {
    return this.ratio;
  }

  updateRatio(newRatio: number): void {
    if (newRatio >= 0 && newRatio <= 1) {
      this.ratio = newRatio;
      this.underlyingSampler = new TraceIdRatioBasedSampler(this.ratio);
    } else {
      throw new Error('Ratio must be between 0 and 1');
    }
  }

  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: Attributes,
    links: Link[]
  ): SamplingResult {
    // TraceIdRatioBasedSampler in @opentelemetry/sdk-trace-base v2+ typically
    // only expects `context` and `traceId` for shouldSample, unlike some other samplers.
    // However, the interface requires all parameters.
    return this.underlyingSampler.shouldSample(
      context,
      traceId
    );
  }

  toString(): string {
    return `DynamicRatioSampler{ratio=${this.ratio}}`;
  }
}
