/**
 * Sentry Error Monitoring Integration
 * 
 * Production-ready error tracking and monitoring
 */

import { logger } from '../logger';

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
  enabled: boolean;
}

class SentryMonitoring {
  private config: SentryConfig;
  private initialized = false;

  constructor() {
    this.config = {
      dsn: process.env.SENTRY_DSN || '',
      environment: process.env.NODE_ENV || 'development',
      release: process.env.GIT_COMMIT_SHA || process.env.npm_package_version,
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      enabled: process.env.NODE_ENV === 'production' && !!process.env.SENTRY_DSN
    };
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      logger.warn('Sentry monitoring disabled - no DSN configured or not in production');
      return;
    }

    if (this.initialized) {
      logger.warn('Sentry already initialized');
      return;
    }

    try {
      // Dynamic import for production only
      const Sentry = await import('@sentry/node');
      const { ProfilingIntegration } = await import('@sentry/profiling-node');

      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        tracesSampleRate: this.config.tracesSampleRate,
        
        integrations: [
          new ProfilingIntegration(),
        ],

        beforeSend(event, hint) {
          // Filter out sensitive data
          if (event.request?.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
            delete event.request.headers['x-api-key'];
          }

          // Filter sensitive query params
          if (event.request?.query_string) {
            const filtered = event.request.query_string
              .split('&')
              .filter(param => !param.startsWith('token=') && !param.startsWith('key='))
              .join('&');
            event.request.query_string = filtered;
          }

          return event;
        },
      });

      this.initialized = true;
      logger.info('Sentry error monitoring initialized', {
        environment: this.config.environment,
        release: this.config.release,
        sampleRate: this.config.tracesSampleRate
      });
    } catch (error) {
      logger.error('Failed to initialize Sentry', error as Error);
      throw error;
    }
  }

  captureError(error: Error, context?: Record<string, unknown>): void {
    if (!this.initialized) {
      logger.error('Error occurred but Sentry not initialized', error, context);
      return;
    }

    import('@sentry/node').then(Sentry => {
      Sentry.captureException(error, {
        extra: context
      });
    });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, unknown>): void {
    if (!this.initialized) {
      logger[level](message, context);
      return;
    }

    import('@sentry/node').then(Sentry => {
      Sentry.captureMessage(message, {
        level: level === 'warning' ? 'warning' : level === 'error' ? 'error' : 'info',
        extra: context
      });
    });
  }

  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.initialized) return;

    import('@sentry/node').then(Sentry => {
      Sentry.setUser(user);
    });
  }

  clearUser(): void {
    if (!this.initialized) return;

    import('@sentry/node').then(Sentry => {
      Sentry.setUser(null);
    });
  }

  addBreadcrumb(breadcrumb: { message: string; category?: string; level?: string; data?: Record<string, unknown> }): void {
    if (!this.initialized) return;

    import('@sentry/node').then(Sentry => {
      Sentry.addBreadcrumb(breadcrumb);
    });
  }

  startTransaction(name: string, op: string): unknown {
    if (!this.initialized) return null;

    return import('@sentry/node').then(Sentry => {
      return Sentry.startTransaction({ name, op });
    });
  }
}

export const sentry = new SentryMonitoring();
