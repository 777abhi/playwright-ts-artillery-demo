import { MetricPoint } from './metrics.service';
import { AiRecommendation } from './ai-analysis.service';

import { EventEmitter } from 'events';

export class PredictiveScalingService extends EventEmitter {
  /**
   * Analyzes historical metrics specifically for predictive scaling based on
   * sharp upward trends in request volume.
   */
  analyze(history: MetricPoint[]): AiRecommendation | null {
    if (!history || history.length < 5) return null;

    // We look at the last 5 intervals
    const recent = history.slice(-5);

    // Check if requests count is strictly increasing over these 5 intervals
    let strictlyIncreasing = true;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].requests <= recent[i - 1].requests) {
        strictlyIncreasing = false;
        break;
      }
    }

    // Check if the jump from the first of the recent to the last is significant
    const firstCount = recent[0].requests;
    const lastCount = recent[recent.length - 1].requests;

    // For example, if it multiplied by 3x or more
    if (strictlyIncreasing && lastCount > firstCount * 3 && lastCount > 50) {
      const recommendation: AiRecommendation = {
        action: 'Pre-provision Compute Resources',
        type: 'scaling',
        confidence: 0.90,
        reason: `Detected sharp upward trend in requests volume (from ${firstCount} to ${lastCount} over the last window). Predictively scaling to handle incoming load.`
      };

      this.emit('scale', recommendation);
      return recommendation;
    }

    return null;
  }
}
