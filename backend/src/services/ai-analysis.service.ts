import { MetricPoint } from './metrics.service';

export interface AiRecommendation {
  action: string;
  type: 'scaling' | 'optimization' | 'remediation';
  confidence: number;
  reason: string;
}

export class AiAnalysisService {
  /**
   * Analyzes historical metric points to provide heuristic/AI-driven recommendations.
   * A real "AI" would use an LLM or ML model; here we use deterministic heuristics
   * as the initial "expert system" step.
   */
  analyze(history: MetricPoint[]): AiRecommendation[] {
    const recommendations: AiRecommendation[] = [];
    if (!history || history.length === 0) return recommendations;

    // We can analyze the recent history or the whole array. Let's look at recent trends.
    // For simplicity, we just aggregate the last few points to see current state.
    const recent = history.slice(-5);
    const avgLatency = recent.reduce((sum, p) => sum + p.avgLatency, 0) / recent.length;
    const avgP95 = recent.reduce((sum, p) => sum + p.p95Latency, 0) / recent.length;
    const avgErrorRate = recent.reduce((sum, p) => sum + p.errorRate, 0) / recent.length;

    // Rule 1: High Latency but relatively low P95-to-Avg ratio -> CPU/Compute bound
    if (avgLatency > 1000 && avgP95 < avgLatency * 2 && avgErrorRate < 0.05) {
      recommendations.push({
        action: 'Scale up Compute Instances',
        type: 'scaling',
        confidence: 0.85,
        reason: `Average latency is persistently high (${Math.round(avgLatency)}ms) without extreme tail latency spikes, suggesting CPU saturation.`
      });
    }

    // Rule 2: High Tail Latency -> DB/External dependency issues
    if (avgP95 > 2000 && avgP95 > avgLatency * 3) {
      recommendations.push({
        action: 'Investigate DB or External API bottlenecks',
        type: 'optimization',
        confidence: 0.90,
        reason: `P95 latency (${Math.round(avgP95)}ms) is significantly higher than average (${Math.round(avgLatency)}ms), indicating occasional long-running external dependencies.`
      });
    }

    // Rule 3: High Error Rate -> Failing service
    if (avgErrorRate >= 0.05) {
      recommendations.push({
        action: 'Initiate Auto-Remediation: Restart Service',
        type: 'remediation',
        confidence: 0.95,
        reason: `Error rate is excessively high (${(avgErrorRate * 100).toFixed(1)}%). Consider automatic instance replacement.`
      });
    }

    return recommendations;
  }
}
