/**
 * LOW-031 to LOW-038: Analytics & Tracking Implementation
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

interface UserProperties {
  userId?: string;
  email?: string;
  name?: string;
  plan?: string;
  [key: string]: any;
}

class Analytics {
  private userId: string | null = null;
  private sessionId: string;
  private events: AnalyticsEvent[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeSession();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession() {
    // Track session start
    this.trackEvent('session_start', {
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
    });
  }

  // LOW-031: User Analytics
  identify(userId: string, properties?: UserProperties) {
    this.userId = userId;
    this.trackEvent('user_identified', {
      userId,
      ...properties,
    });
  }

  // LOW-038: Custom Event Tracking
  trackEvent(eventName: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        userId: this.userId,
        sessionId: this.sessionId,
        url: window.location.href,
        referrer: document.referrer,
      },
      timestamp: new Date(),
    };

    this.events.push(event);
    
    // Send to backend
    this.sendEvent(event);
    
    console.log('Analytics Event:', event);
  }

  // LOW-032: Conversion Tracking
  trackConversion(conversionType: string, value?: number, properties?: Record<string, any>) {
    this.trackEvent('conversion', {
      conversionType,
      value,
      ...properties,
    });
  }

  // Page view tracking
  trackPageView(page: string, properties?: Record<string, any>) {
    this.trackEvent('page_view', {
      page,
      title: document.title,
      ...properties,
    });
  }

  // E-commerce tracking
  trackPurchase(orderId: string, value: number, items: any[]) {
    this.trackEvent('purchase', {
      orderId,
      value,
      currency: 'USD',
      items,
    });
  }

  trackAddToCart(productId: string, productName: string, price: number) {
    this.trackEvent('add_to_cart', {
      productId,
      productName,
      price,
    });
  }

  trackCheckoutStarted(value: number, items: any[]) {
    this.trackEvent('checkout_started', {
      value,
      items,
    });
  }

  // User interaction tracking
  trackClick(element: string, properties?: Record<string, any>) {
    this.trackEvent('click', {
      element,
      ...properties,
    });
  }

  trackFormSubmit(formName: string, properties?: Record<string, any>) {
    this.trackEvent('form_submit', {
      formName,
      ...properties,
    });
  }

  trackSearch(query: string, resultsCount?: number) {
    this.trackEvent('search', {
      query,
      resultsCount,
    });
  }

  // LOW-033: A/B Testing
  trackExperiment(experimentId: string, variant: string) {
    this.trackEvent('experiment_view', {
      experimentId,
      variant,
    });
  }

  // Error tracking enhancement (LOW-034)
  trackError(error: Error, context?: Record<string, any>) {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  // Send event to backend
  private async sendEvent(event: AnalyticsEvent) {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  // Get session data
  getSessionData() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      events: this.events,
    };
  }
}

// Singleton instance
export const analytics = new Analytics();

// React hook for analytics
export function useAnalytics() {
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    analytics.trackEvent(eventName, properties);
  };

  const trackPageView = (page: string, properties?: Record<string, any>) => {
    analytics.trackPageView(page, properties);
  };

  const identify = (userId: string, properties?: UserProperties) => {
    analytics.identify(userId, properties);
  };

  return {
    trackEvent,
    trackPageView,
    identify,
    trackConversion: analytics.trackConversion.bind(analytics),
    trackPurchase: analytics.trackPurchase.bind(analytics),
    trackAddToCart: analytics.trackAddToCart.bind(analytics),
    trackClick: analytics.trackClick.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
  };
}

// Auto-track page views (for React Router or similar)
export function initializeAnalytics() {
  // Track initial page view
  analytics.trackPageView(window.location.pathname);

  // Track page views on navigation
  let lastPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    const currentPath = window.location.pathname;
    if (currentPath !== lastPath) {
      lastPath = currentPath;
      analytics.trackPageView(currentPath);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return analytics;
}
