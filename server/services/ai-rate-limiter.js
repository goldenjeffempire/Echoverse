import { logger } from '../logger';
class AIRateLimiter {
    constructor() {
        this.quotas = new Map();
        this.tierLimits = {
            free: {
                maxRequestsPerDay: parseInt(process.env.AI_RATE_LIMIT_TIER_FREE || '10'),
                maxCostPerDay: 1.00
            },
            pro: {
                maxRequestsPerDay: parseInt(process.env.AI_RATE_LIMIT_TIER_PRO || '100'),
                maxCostPerDay: 10.00
            },
            enterprise: {
                maxRequestsPerDay: parseInt(process.env.AI_RATE_LIMIT_TIER_ENTERPRISE || '1000'),
                maxCostPerDay: 100.00
            }
        };
    }
    async checkLimit(userId, tier, estimatedCost = 0) {
        const quota = this.getOrCreateQuota(userId, tier);
        const limits = this.tierLimits[tier];
        // Reset if new day
        if (this.shouldReset(quota.lastReset)) {
            quota.requestsToday = 0;
            quota.costToday = 0;
            quota.lastReset = new Date();
        }
        // Check request limit
        if (quota.requestsToday >= limits.maxRequestsPerDay) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: this.getNextResetDate(),
                reason: 'Daily request limit exceeded'
            };
        }
        // Check cost limit
        if (quota.costToday + estimatedCost > limits.maxCostPerDay) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: this.getNextResetDate(),
                reason: 'Daily cost budget exceeded'
            };
        }
        const remaining = limits.maxRequestsPerDay - quota.requestsToday;
        return {
            allowed: true,
            remaining,
            resetAt: this.getNextResetDate()
        };
    }
    async recordUsage(userId, tier, cost) {
        const quota = this.getOrCreateQuota(userId, tier);
        quota.requestsToday++;
        quota.costToday += cost;
        this.quotas.set(userId, quota);
        logger.info('AI usage recorded', {
            userId,
            tier,
            requestsToday: quota.requestsToday,
            costToday: quota.costToday.toFixed(4)
        });
    }
    async getQuotaStatus(userId, tier) {
        const quota = this.getOrCreateQuota(userId, tier);
        const limits = this.tierLimits[tier];
        if (this.shouldReset(quota.lastReset)) {
            quota.requestsToday = 0;
            quota.costToday = 0;
            quota.lastReset = new Date();
        }
        return {
            requestsUsed: quota.requestsToday,
            requestsLimit: limits.maxRequestsPerDay,
            costUsed: quota.costToday,
            costLimit: limits.maxCostPerDay,
            resetAt: this.getNextResetDate()
        };
    }
    getOrCreateQuota(userId, tier) {
        let quota = this.quotas.get(userId);
        if (!quota) {
            quota = {
                userId,
                tier,
                requestsToday: 0,
                costToday: 0,
                lastReset: new Date()
            };
            this.quotas.set(userId, quota);
        }
        else if (quota.tier !== tier) {
            // Tier changed, update it
            quota.tier = tier;
        }
        return quota;
    }
    shouldReset(lastReset) {
        const now = new Date();
        return now.getDate() !== lastReset.getDate() ||
            now.getMonth() !== lastReset.getMonth() ||
            now.getFullYear() !== lastReset.getFullYear();
    }
    getNextResetDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
    }
    // Calculate estimated cost based on model and tokens
    estimateCost(model, tokens) {
        const costPerToken = {
            'gpt-4': 0.00003, // $0.03 per 1K tokens
            'gpt-4-turbo': 0.00001, // $0.01 per 1K tokens
            'gpt-3.5-turbo': 0.0000015, // $0.0015 per 1K tokens
            'llama2': 0, // Free (local)
            'default': 0.00001
        };
        const rate = costPerToken[model] || costPerToken['default'];
        return tokens * rate;
    }
    clearQuotas() {
        this.quotas.clear();
        logger.info('All AI rate limit quotas cleared');
    }
}
export const aiRateLimiter = new AIRateLimiter();
