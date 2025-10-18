/**
 * Sentry Error Monitoring Integration
 * 
 * Production-ready error tracking and monitoring
 * Gracefully handles missing @sentry/node dependency
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
  private sentryAvailable = false;

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
      // Dynamic import for production only - check if package exists
      const Sentry = await import('@sentry/node').catch(() => null);
      if (!Sentry) {
        logger.warn('Sentry package not installed - error monitoring disabled');
        this.sentryAvailable = false;
        return;
      }

      const ProfilingModule = await import('@sentry/profiling-node').catch(() => null);

      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        tracesSampleRate: this.config.tracesSampleRate,
        
        integrations: ProfilingModule ? [
          ProfilingModule.nodeProfilingIntegration(),
        ] : [],

        beforeSend(event: any, hint: any) {
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
              .filter((param: string) => !param.startsWith('token=') && !param.startsWith('key='))
              .join('&');
            event.request.query_string = filtered;
          }

          return event;
        },
      });

      this.initialized = true;
      this.sentryAvailable = true;
      logger.info('Sentry error monitoring initialized', {
        environment: this.config.environment,
        release: this.config.release,
        sampleRate: this.config.tracesSampleRate
      });
    } catch (error) {
      logger.error('Failed to initialize Sentry', error as Error);
      this.sentryAvailable = false;
    }
  }

  captureError(error: Error, context?: Record<string, unknown>): void {
    if (!this.initialized || !this.sentryAvailable) {
      logger.error('Error occurred but Sentry not initialized', error, context);
      return;
    }

    import('@sentry/node').then(Sentry => {
      Sentry.captureException(error, {
        extra: context
      });
    }).catch(() => {
      logger.error('Failed to capture error with Sentry', error, context);
    });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, unknown>): void {
    if (!this.initialized || !this.sentryAvailable) {
      const logLevel = level === 'warning' ? 'warn' : level;
      if (logLevel === 'info') {
        logger.info(message, context);
      } else if (logLevel === 'warn') {
        logger.warn(message, context);
      } else {
        logger.error(message, context instanceof Error ? context : undefined, typeof context === 'object' ? context : undefined);
      }
      return;
    }

    import('@sentry/node').then(Sentry => {
      Sentry.captureMessage(message, {
        level: level === 'warning' ? 'warning' : level === 'error' ? 'error' : 'info',
        extra: context
      });
    }).catch(() => {
      logger.error(`Failed to capture message with Sentry: ${message}`, undefined, context);
    });
  }

  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.initialized || !this.sentryAvailable) return;

    import('@sentry/node').then(Sentry => {
      Sentry.setUser(user);
    }).catch(() => {
      // Silently fail
    });
  }

  clearUser(): void {
    if (!this.initialized || !this.sentryAvailable) return;

    import('@sentry/node').then(Sentry => {
      Sentry.setUser(null);
    }).catch(() => {
      // Silently fail
    });
  }

  addBreadcrumb(breadcrumb: { message: string; category?: string; level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'; data?: Record<string, unknown> }): void {
    if (!this.initialized || !this.sentryAvailable) return;

    import('@sentry/node').then(Sentry => {
      Sentry.addBreadcrumb(breadcrumb);
    }).catch(() => {
      // Silently fail
    });
  }

  async startSpan<T>(name: string, op: string, callback: () => Promise<T> | T): Promise<T | null> {
    if (!this.initialized || !this.sentryAvailable) {
      try {
        return await callback();
      } catch (error) {
        this.captureError(error as Error);
        throw error;
      }
    }

    try {
      const Sentry = await import('@sentry/node');
      return await Sentry.startSpan({ name, op }, callback);
    } catch (error) {
      this.captureError(error as Error);
      throw error;
    }
  }
}

export const sentry = new SentryMonitoring();
