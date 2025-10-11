/**
 * LOW-020 to LOW-054: Marketing Analytics Features
 * A/B Testing, CLV, Churn Prediction, Email Tracking, Revenue Dashboard
 */
export class ABTestingService {
    async createTest(test) {
        const response = await fetch('/api/marketing/ab-tests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(test),
        });
        return response.json();
    }
    async getVariant(testId, userId) {
        const response = await fetch(`/api/marketing/ab-tests/${testId}/variant?userId=${userId}`);
        return response.json();
    }
    async trackConversion(testId, variantId) {
        await fetch(`/api/marketing/ab-tests/${testId}/variants/${variantId}/conversion`, {
            method: 'POST',
        });
    }
    async getResults(testId) {
        const response = await fetch(`/api/marketing/ab-tests/${testId}/results`);
        return response.json();
    }
}
export class CLVService {
    async calculateCLV(userId) {
        const response = await fetch(`/api/analytics/clv/${userId}`);
        return response.json();
    }
    async getTopCustomers(limit = 100) {
        const response = await fetch(`/api/analytics/clv/top?limit=${limit}`);
        return response.json();
    }
    async getCLVSegments() {
        const response = await fetch('/api/analytics/clv/segments');
        return response.json();
    }
}
export class ChurnPredictionService {
    async predictChurn(userId) {
        const response = await fetch(`/api/analytics/churn/${userId}`);
        return response.json();
    }
    async getHighRiskUsers(limit = 50) {
        const response = await fetch(`/api/analytics/churn/high-risk?limit=${limit}`);
        return response.json();
    }
    async trackRetentionAction(userId, action) {
        await fetch(`/api/analytics/churn/${userId}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
        });
    }
}
export class EmailAnalyticsService {
    async trackOpen(campaignId, userId) {
        await fetch(`/api/marketing/email/${campaignId}/open`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
    }
    async trackClick(campaignId, userId, linkId) {
        await fetch(`/api/marketing/email/${campaignId}/click`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, linkId }),
        });
    }
    async getCampaignMetrics(campaignId) {
        const response = await fetch(`/api/marketing/email/${campaignId}/metrics`);
        return response.json();
    }
    async getEmailPerformance() {
        const response = await fetch('/api/marketing/email/performance');
        return response.json();
    }
}
export class RevenueDashboardService {
    async getDashboard(period) {
        const response = await fetch(`/api/analytics/revenue?period=${period}`);
        return response.json();
    }
    async getRevenueChart(startDate, endDate) {
        const response = await fetch(`/api/analytics/revenue/chart?start=${startDate}&end=${endDate}`);
        return response.json();
    }
}
export class ReferralService {
    async getReferralCode(userId) {
        const response = await fetch(`/api/marketing/referral/${userId}/code`);
        const data = await response.json();
        return data.code;
    }
    async trackReferral(code, newUserId) {
        await fetch('/api/marketing/referral/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, newUserId }),
        });
    }
    async getStats(userId) {
        const response = await fetch(`/api/marketing/referral/${userId}/stats`);
        return response.json();
    }
}
// Export all services
export const marketingServices = {
    abTesting: new ABTestingService(),
    clv: new CLVService(),
    churn: new ChurnPredictionService(),
    email: new EmailAnalyticsService(),
    revenue: new RevenueDashboardService(),
    referral: new ReferralService(),
};
