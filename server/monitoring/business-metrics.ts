/**
 * Business Metrics for Monitoring
 * Issue #34: Add custom business metrics
 */

import { Counter, Gauge, Histogram } from 'prom-client';

// Order metrics
export const orderCompletionRate = new Gauge({
  name: 'order_completion_rate',
  help: 'Percentage of orders successfully completed',
  labelNames: ['status']
});

export const revenuePerUser = new Gauge({
  name: 'revenue_per_user',
  help: 'Average revenue generated per user',
  labelNames: ['tier']
});

export const cartAbandonmentRate = new Gauge({
  name: 'cart_abandonment_rate',
  help: 'Percentage of abandoned shopping carts',
});

// User metrics
export const activeUsersGauge = new Gauge({
  name: 'active_users_total',
  help: 'Total number of active users',
  labelNames: ['period']
});

export const userSignupsCounter = new Counter({
  name: 'user_signups_total',
  help: 'Total number of user signups',
  labelNames: ['source']
});

// AI metrics
export const aiRequestsCounter = new Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['provider', 'model', 'status']
});

export const aiCostGauge = new Gauge({
  name: 'ai_cost_usd',
  help: 'Total AI cost in USD',
  labelNames: ['provider']
});

// Content metrics
export const contentCreationCounter = new Counter({
  name: 'content_creation_total',
  help: 'Total number of content items created',
  labelNames: ['type']
});

// Payment metrics
export const paymentSuccessRate = new Gauge({
  name: 'payment_success_rate',
  help: 'Percentage of successful payments'
});

export const subscriptionChurnRate = new Gauge({
  name: 'subscription_churn_rate',
  help: 'Monthly subscription churn rate',
  labelNames: ['tier']
});

// Helper functions to update metrics
export function trackOrder(status: 'completed' | 'cancelled' | 'failed') {
  orderCompletionRate.labels(status).inc();
}

export function updateRevenuePerUser(tier: string, revenue: number) {
  revenuePerUser.labels(tier).set(revenue);
}

export function trackCartAbandonment(abandoned: boolean) {
  if (abandoned) {
    cartAbandonmentRate.inc();
  }
}

export function trackUserSignup(source: string = 'direct') {
  userSignupsCounter.labels(source).inc();
}

export function trackAIRequest(provider: string, model: string, status: 'success' | 'error') {
  aiRequestsCounter.labels(provider, model, status).inc();
}

export function updateAICost(provider: string, cost: number) {
  aiCostGauge.labels(provider).inc(cost);
}

export function trackContentCreation(type: 'post' | 'product' | 'website') {
  contentCreationCounter.labels(type).inc();
}
