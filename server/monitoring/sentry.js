/**
 * Sentry Error Monitoring Integration
 *
 * Production-ready error tracking and monitoring
 * Gracefully handles missing @sentry/node dependency
 */
import { logger } from '../logger';
class SentryMonitoring {
    constructor() {
        this.initialized = false;
        this.sentryAvailable = false;
        this.config = {
            dsn: process.env.SENTRY_DSN || '',
            environment: process.env.NODE_ENV || 'development',
            release: process.env.GIT_COMMIT_SHA || process.env.npm_package_version,
            tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
            enabled: process.env.NODE_ENV === 'production' && !!process.env.SENTRY_DSN
        };
    }
    async initialize() {
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
                            .filter((param) => !param.startsWith('token=') && !param.startsWith('key='))
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
        }
        catch (error) {
            logger.error('Failed to initialize Sentry', error);
            this.sentryAvailable = false;
        }
    }
    captureError(error, context) {
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
    captureMessage(message, level = 'info', context) {
        if (!this.initialized || !this.sentryAvailable) {
            const logLevel = level === 'warning' ? 'warn' : level;
            if (logLevel === 'info') {
                logger.info(message, context);
            }
            else if (logLevel === 'warn') {
                logger.warn(message, context);
            }
            else {
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
    setUser(user) {
        if (!this.initialized || !this.sentryAvailable)
            return;
        import('@sentry/node').then(Sentry => {
            Sentry.setUser(user);
        }).catch(() => {
            // Silently fail
        });
    }
    clearUser() {
        if (!this.initialized || !this.sentryAvailable)
            return;
        import('@sentry/node').then(Sentry => {
            Sentry.setUser(null);
        }).catch(() => {
            // Silently fail
        });
    }
    addBreadcrumb(breadcrumb) {
        if (!this.initialized || !this.sentryAvailable)
            return;
        import('@sentry/node').then(Sentry => {
            Sentry.addBreadcrumb(breadcrumb);
        }).catch(() => {
            // Silently fail
        });
    }
    async startSpan(name, op, callback) {
        if (!this.initialized || !this.sentryAvailable) {
            try {
                return await callback();
            }
            catch (error) {
                this.captureError(error);
                throw error;
            }
        }
        try {
            const Sentry = await import('@sentry/node');
            return await Sentry.startSpan({ name, op }, callback);
        }
        catch (error) {
            this.captureError(error);
            throw error;
        }
    }
}
export const sentry = new SentryMonitoring();
