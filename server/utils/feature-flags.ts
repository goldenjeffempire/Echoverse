/**
 * Feature Flags System
 * Enables/disables features dynamically without code deployment
 */

import { logger } from '../logger';

export enum FeatureFlag {
  AI_CONTENT_GENERATION = 'ai_content_generation',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  COMMUNITY_FEATURES = 'community_features',
  E_COMMERCE = 'e_commerce',
  PLUGIN_MARKETPLACE = 'plugin_marketplace',
  TWO_FACTOR_AUTH = 'two_factor_auth',
  WEBHOOKS = 'webhooks',
  API_ACCESS = 'api_access',
  CUSTOM_DOMAINS = 'custom_domains',
  WHITE_LABEL = 'white_label',
  BETA_FEATURES = 'beta_features',
  MAINTENANCE_MODE = 'maintenance_mode'
}

interface FlagConfig {
  enabled: boolean;
  rolloutPercentage?: number;
  allowedUserIds?: string[];
  allowedPlans?: string[];
  requiresFeature?: string;
}

class FeatureFlagManager {
  private flags: Map<string, FlagConfig> = new Map();
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.flags.set(FeatureFlag.AI_CONTENT_GENERATION, {
      enabled: true,
      allowedPlans: ['pro', 'enterprise']
    });

    this.flags.set(FeatureFlag.ADVANCED_ANALYTICS, {
      enabled: true,
      allowedPlans: ['pro', 'enterprise']
    });

    this.flags.set(FeatureFlag.COMMUNITY_FEATURES, {
      enabled: true
    });

    this.flags.set(FeatureFlag.E_COMMERCE, {
      enabled: true
    });

    this.flags.set(FeatureFlag.PLUGIN_MARKETPLACE, {
      enabled: true
    });

    this.flags.set(FeatureFlag.TWO_FACTOR_AUTH, {
      enabled: true
    });

    this.flags.set(FeatureFlag.WEBHOOKS, {
      enabled: true,
      allowedPlans: ['pro', 'enterprise']
    });

    this.flags.set(FeatureFlag.API_ACCESS, {
      enabled: true,
      allowedPlans: ['pro', 'enterprise']
    });

    this.flags.set(FeatureFlag.CUSTOM_DOMAINS, {
      enabled: true,
      allowedPlans: ['pro', 'enterprise']
    });

    this.flags.set(FeatureFlag.WHITE_LABEL, {
      enabled: true,
      allowedPlans: ['enterprise']
    });

    this.flags.set(FeatureFlag.BETA_FEATURES, {
      enabled: false,
      rolloutPercentage: 10
    });

    this.flags.set(FeatureFlag.MAINTENANCE_MODE, {
      enabled: false
    });

    this.initialized = true;
    logger.info('Feature flags initialized', {
      totalFlags: this.flags.size,
      enabledFlags: Array.from(this.flags.entries())
        .filter(([_, config]) => config.enabled)
        .map(([flag]) => flag)
    });
  }

  isEnabled(
    flag: FeatureFlag,
    context?: {
      userId?: string;
      userPlan?: string;
    }
  ): boolean {
    const config = this.flags.get(flag);
    
    if (!config || !config.enabled) {
      return false;
    }

    if (config.allowedUserIds && context?.userId) {
      if (!config.allowedUserIds.includes(context.userId)) {
        return false;
      }
    }

    if (config.allowedPlans && context?.userPlan) {
      if (!config.allowedPlans.includes(context.userPlan)) {
        return false;
      }
    }

    if (config.rolloutPercentage !== undefined && context?.userId) {
      const hash = this.hashUserId(context.userId);
      const percentage = hash % 100;
      return percentage < config.rolloutPercentage;
    }

    return true;
  }

  enable(flag: FeatureFlag, config?: Partial<FlagConfig>): void {
    const existing = this.flags.get(flag) || { enabled: false };
    this.flags.set(flag, {
      ...existing,
      ...config,
      enabled: true
    });
    logger.info('Feature flag enabled', { flag, config });
  }

  disable(flag: FeatureFlag): void {
    const existing = this.flags.get(flag);
    if (existing) {
      this.flags.set(flag, { ...existing, enabled: false });
      logger.info('Feature flag disabled', { flag });
    }
  }

  getAllFlags(): Map<string, FlagConfig> {
    return new Map(this.flags);
  }

  getFlagStatus(flag: FeatureFlag): FlagConfig | undefined {
    return this.flags.get(flag);
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  setRolloutPercentage(flag: FeatureFlag, percentage: number): void {
    const existing = this.flags.get(flag);
    if (existing) {
      this.flags.set(flag, {
        ...existing,
        rolloutPercentage: Math.max(0, Math.min(100, percentage))
      });
      logger.info('Feature flag rollout updated', { flag, percentage });
    }
  }

  addAllowedUser(flag: FeatureFlag, userId: string): void {
    const existing = this.flags.get(flag);
    if (existing) {
      const allowedUserIds = existing.allowedUserIds || [];
      if (!allowedUserIds.includes(userId)) {
        allowedUserIds.push(userId);
        this.flags.set(flag, { ...existing, allowedUserIds });
        logger.info('User added to feature flag', { flag, userId });
      }
    }
  }

  removeAllowedUser(flag: FeatureFlag, userId: string): void {
    const existing = this.flags.get(flag);
    if (existing && existing.allowedUserIds) {
      const allowedUserIds = existing.allowedUserIds.filter(id => id !== userId);
      this.flags.set(flag, { ...existing, allowedUserIds });
      logger.info('User removed from feature flag', { flag, userId });
    }
  }
}

export const featureFlags = new FeatureFlagManager();
