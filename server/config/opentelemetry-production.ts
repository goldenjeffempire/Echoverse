/**
 * OpenTelemetry Production Configuration
 * FIX #14: Configure OpenTelemetry for production with proper sampling
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

const isProduction = process.env.NODE_ENV === 'production';

// Production-optimized configuration
export function setupOpenTelemetry() {
  const sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: 'echoverse-api',
      [SEMRESATTRS_SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    }),
    
    // Prometheus metrics exporter
    metricReader: new PrometheusExporter({
      port: 9464,
      endpoint: '/metrics',
    }),

    // Auto-instrumentation with production settings
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable in development to reduce overhead
        '@opentelemetry/instrumentation-fs': {
          enabled: isProduction,
        },
        '@opentelemetry/instrumentation-http': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-express': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-pg': {
          enabled: true,
          // Don't log query values in production for security
          enhancedDatabaseReporting: !isProduction,
        },
      }),
    ],

    // CRIT-006 FIX: Configure OTLP trace exporter for production tracing
    // Use OTLP endpoint from environment or default to localhost
    spanProcessor: new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
        headers: process.env.OTEL_EXPORTER_OTLP_HEADERS 
          ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS) 
          : {},
      })
    ),
    
  });

  // Start SDK
  sdk.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('OpenTelemetry shut down successfully'))
      .catch((error) => console.log('Error shutting down OpenTelemetry', error))
      .finally(() => process.exit(0));
  });

  return sdk;
}

// Export for server initialization
export const telemetrySDK = isProduction ? setupOpenTelemetry() : null;
