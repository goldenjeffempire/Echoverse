/**
 * AI Cost Tracker - HIGH PRIORITY #19
 * 
 * Database-backed AI cost tracking for production multi-instance deployments
 * Tracks token usage, costs, and provides analytics for billing and monitoring
 */

import { logger } from '../logger';
import { storage } from '../storage';
import { TIME_CONSTANTS } from '@shared/constants';

export interface CostEntry {
  id: string;
  timestamp: Date;
  provider: 'openai' | 'local' | 'anthropic';
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  userId?: string;
  feature: string;
  requestDurationMs?: number;
  success?: boolean;
  errorMessage?: string;
  metadata?: any;
}

class CostTracker {
  // OpenAI pricing (as of 2024-2025) - adjust based on current rates
  private readonly pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 0.005 / 1000, output: 0.015 / 1000 }, // $5 per 1M input, $15 per 1M output
    'gpt-4o-mini': { input: 0.00015 / 1000, output: 0.0006 / 1000 }, // $0.15 per 1M input, $0.60 per 1M output
    'gpt-3.5-turbo': { input: 0.0005 / 1000, output: 0.0015 / 1000 }, // $0.50 per 1M input, $1.50 per 1M output
    'o1-preview': { input: 0.015 / 1000, output: 0.060 / 1000 }, // $15 per 1M input, $60 per 1M output
    'o1-mini': { input: 0.003 / 1000, output: 0.012 / 1000 }, // $3 per 1M input, $12 per 1M output
  };

  /**
   * Track AI usage with database persistence
   * @param entry - Cost tracking entry details
   */
  async track(entry: Omit<CostEntry, 'id' | 'timestamp' | 'estimatedCost'>): Promise<void> {
    try {
      const cost = this.calculateCost(entry.model, entry.promptTokens, entry.completionTokens);
      
      // Persist to database for production tracking
      await storage.trackAICost({
        userId: entry.userId,
        provider: entry.provider,
        model: entry.model,
        feature: entry.feature,
        promptTokens: entry.promptTokens,
        completionTokens: entry.completionTokens,
        totalTokens: entry.totalTokens,
        estimatedCost: cost,
        requestDurationMs: entry.requestDurationMs,
        success: entry.success ?? true,
        errorMessage: entry.errorMessage,
        metadata: entry.metadata,
      });
      
      logger.info('AI cost tracked', {
        provider: entry.provider,
        model: entry.model,
        totalTokens: entry.totalTokens,
        estimatedCost: cost,
        feature: entry.feature,
        userId: entry.userId,
      });

      // Check for cost alerts
      if (entry.userId) {
        await this.checkCostAlerts(entry.userId);
      }
    } catch (error) {
      logger.error('Failed to track AI cost', error instanceof Error ? error : new Error(String(error)), {
        provider: entry.provider,
        feature: entry.feature,
      });
    }
  }

  /**
   * Calculate estimated cost based on model and token usage
   */
  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    // Local models are free
    if (model.includes('local') || model.includes('llama') || model.includes('ollama')) {
      return 0;
    }
    
    // Find matching pricing tier
    let rates = this.pricing['gpt-4o']; // Default to gpt-4o pricing
    
    for (const [key, value] of Object.entries(this.pricing)) {
      if (model.toLowerCase().includes(key.toLowerCase())) {
        rates = value;
        break;
      }
    }
    
    const inputCost = promptTokens * rates.input;
    const outputCost = completionTokens * rates.output;
    
    return inputCost + outputCost;
  }

  /**
   * Get AI cost statistics for a time period
   * @param period - Time period: 'hour', 'day', 'week', 'month'
   * @param userId - Optional user ID to filter by
   */
  async getStats(
    period: 'hour' | 'day' | 'week' | 'month' = 'day',
    userId?: string
  ): Promise<{
    totalCost: number;
    totalRequests: number;
    totalTokens: number;
    byProvider: Record<string, { cost: number; requests: number; tokens: number }>;
    byFeature: Record<string, { cost: number; requests: number; tokens: number }>;
  }> {
    const now = new Date();
    const periodMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    }[period];
    
    const startDate = new Date(now.getTime() - periodMs);
    
    return await storage.getAICostStats({
      userId,
      startDate,
      endDate: now,
    });
  }

  /**
   * Check if user has exceeded cost thresholds and send alerts
   * HIGH PRIORITY FIX #5: Implement actual cost alerts with notification integration
   */
  private async checkCostAlerts(userId: string): Promise<void> {
    try {
      const dayStats = await this.getStats('day', userId);
      const monthStats = await this.getStats('month', userId);

      // Check if alerts already sent recently (prevent spam)
      const lastDailyAlert = await storage.getLastCostAlert(userId, 'daily');
      const lastMonthlyAlert = await storage.getLastCostAlert(userId, 'monthly');
      
      const now = Date.now();
      const DAILY_ALERT_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours
      const MONTHLY_ALERT_COOLDOWN = 7 * 24 * 60 * 60 * 1000; // 7 days

      // Daily threshold: $10
      if (dayStats.totalCost > 10) {
        if (!lastDailyAlert || (now - lastDailyAlert.getTime()) > DAILY_ALERT_COOLDOWN) {
          logger.warn('User exceeded daily AI cost threshold', {
            userId,
            cost: dayStats.totalCost,
            threshold: 10,
            requests: dayStats.totalRequests,
          });

          // Send actual notification
          await this.sendCostAlert(userId, {
            type: 'daily',
            cost: dayStats.totalCost,
            threshold: 10,
            requests: dayStats.totalRequests,
          });
          
          // Record alert sent
          await storage.recordCostAlert({
            userId,
            alertType: 'daily',
            threshold: 10,
            currentCost: dayStats.totalCost
          });
        }
      }

      // Monthly threshold: $100
      if (monthStats.totalCost > 100) {
        if (!lastMonthlyAlert || (now - lastMonthlyAlert.getTime()) > MONTHLY_ALERT_COOLDOWN) {
          logger.warn('User exceeded monthly AI cost threshold', {
            userId,
            cost: monthStats.totalCost,
            threshold: 100,
            requests: monthStats.totalRequests,
          });

          // Send actual notification
          await this.sendCostAlert(userId, {
            type: 'monthly',
            cost: monthStats.totalCost,
            threshold: 100,
            requests: monthStats.totalRequests,
          });
          
          // Record alert sent
          await storage.recordCostAlert({
            userId,
            alertType: 'monthly',
            threshold: 100,
            currentCost: monthStats.totalCost
          });
        }
      }
    } catch (error) {
      logger.error('Failed to check cost alerts', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Send cost alert notification to user
   * Integrates with notification system
   */
  private async sendCostAlert(userId: string, alert: {
    type: 'daily' | 'monthly';
    cost: number;
    threshold: number;
    requests: number;
  }): Promise<void> {
    try {
      const user = await storage.getUserById(userId);
      if (!user) return;

      // Send email notification if email service is configured
      const { emailService } = await import('../services/email');
      const period = alert.type === 'daily' ? 'today' : 'this month';
      const costFormatted = alert.cost.toFixed(2);
      const thresholdFormatted = alert.threshold.toFixed(2);
      
      await emailService.sendEmail({
        to: user.email,
        subject: `AI Usage Cost Alert - $${costFormatted} ${period}`,
        html: `
          <h2>AI Usage Cost Alert</h2>
          <p>Your AI usage costs have exceeded the ${alert.type} threshold.</p>
          <ul>
            <li><strong>Current ${alert.type} cost:</strong> $${costFormatted}</li>
            <li><strong>Threshold:</strong> $${thresholdFormatted}</li>
            <li><strong>Total requests:</strong> ${alert.requests}</li>
          </ul>
          <p>Please review your AI usage and consider optimizing your requests.</p>
        `,
      }).catch((err: Error) => {
        logger.warn('Failed to send cost alert email', { userId, error: err.message });
      });

      logger.info('Cost alert sent successfully', {
        userId,
        type: alert.type,
        cost: alert.cost,
        email: user.email,
      });
    } catch (error) {
      logger.error('Failed to send cost alert', error instanceof Error ? error : new Error(String(error)), {
        userId,
        alertType: alert.type,
      });
    }
  }

  /**
   * Get cost alert status for a specific threshold
   */
  async getCostAlert(
    threshold: number = 100,
    period: 'day' | 'week' | 'month' = 'day',
    userId?: string
  ): Promise<{ 
    exceeded: boolean; 
    current: number; 
    threshold: number;
    percentUsed: number;
  }> {
    const stats = await this.getStats(period, userId);
    const percentUsed = (stats.totalCost / threshold) * 100;
    
    return {
      exceeded: stats.totalCost > threshold,
      current: stats.totalCost,
      threshold,
      percentUsed: Math.round(percentUsed * 100) / 100,
    };
  }

  /**
   * Get detailed cost breakdown by feature
   */
  async getCostBreakdown(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalCost: number;
    byFeature: Array<{ feature: string; cost: number; requests: number; tokens: number }>;
    byProvider: Array<{ provider: string; cost: number; requests: number; tokens: number }>;
  }> {
    const stats = await storage.getAICostStats({
      userId,
      startDate,
      endDate,
    });

    return {
      totalCost: stats.totalCost,
      byFeature: Object.entries(stats.byFeature)
        .map(([feature, data]) => ({ feature, ...data }))
        .sort((a, b) => b.cost - a.cost),
      byProvider: Object.entries(stats.byProvider)
        .map(([provider, data]) => ({ provider, ...data }))
        .sort((a, b) => b.cost - a.cost),
    };
  }

  /**
   * Estimate cost for a request before making it
   */
  estimateCost(model: string, estimatedPromptTokens: number, estimatedCompletionTokens: number): number {
    return this.calculateCost(model, estimatedPromptTokens, estimatedCompletionTokens);
  }
}

export const costTracker = new CostTracker();
