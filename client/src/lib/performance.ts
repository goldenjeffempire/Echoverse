
import { detect } from 'detect-browser';

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private browser = detect();
  private thresholds: Map<string, number> = new Map([
    ['pageLoad', 3000],
    ['apiResponse', 1000],
    ['renderTime', 100]
  ]);

  track(metric: string, value: number, context?: Record<string, any>) {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }
    this.metrics.get(metric)?.push(value);
    
    if (value > this.getThreshold(metric)) {
      this.reportIssue(metric, value);
    }
  }

  private getThreshold(metric: string): number {
    const measurements = this.metrics.get(metric) || [];
    if (measurements.length < 5) return Infinity;
    
    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    return avg * 1.5;
  }

  private reportIssue(metric: string, value: number) {
    console.warn(`Performance issue detected: ${metric} = ${value}ms`);
  }
}

export const performanceMonitor = new PerformanceMonitor();
