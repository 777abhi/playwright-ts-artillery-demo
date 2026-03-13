import { Context, SpanKind, Attributes, Link } from '@opentelemetry/api';
import { Sampler, SamplingResult, SamplingDecision } from '@opentelemetry/sdk-trace-base';

export class IntelligentSampler implements Sampler {
  constructor(private readonly underlyingSampler: Sampler) {}

  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: Attributes,
    links: Link[]
  ): SamplingResult {
    const isDegraded = this.isDegradedPath(attributes);

    if (isDegraded) {
      return { decision: SamplingDecision.RECORD_AND_SAMPLED };
    }

    return this.underlyingSampler.shouldSample(
      context,
      traceId,
      spanName,
      spanKind,
      attributes,
      links
    );
  }

  private isDegradedPath(attributes: Attributes): boolean {
    let query = '';

    // Extract query string from attributes
    if (attributes['url.query'] && typeof attributes['url.query'] === 'string') {
      query = attributes['url.query'];
    } else if (attributes['url.full'] && typeof attributes['url.full'] === 'string') {
      try {
        const url = new URL(attributes['url.full']);
        query = url.search;
      } catch (e) {
        // ignore invalid urls
      }
    } else if (attributes['http.url'] && typeof attributes['http.url'] === 'string') {
      try {
        const url = new URL(attributes['http.url']);
        query = url.search;
      } catch (e) {
        // ignore invalid urls
      }
    }

    if (!query) {
      return false;
    }

    const params = new URLSearchParams(query);

    const delay = parseInt(params.get('delay') || '0', 10);
    const memoryStress = parseInt(params.get('memoryStress') || '0', 10);
    const cpuLoad = parseInt(params.get('cpuLoad') || '0', 10);
    const jitter = parseInt(params.get('jitter') || '0', 10);

    if (delay >= 1000 || delay < 0 || memoryStress > 0 || cpuLoad > 0 || jitter > 0) {
      return true;
    }

    return false;
  }

  toString(): string {
    return `IntelligentSampler{underlying=${this.underlyingSampler.toString()}}`;
  }
}
