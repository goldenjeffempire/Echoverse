import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { logger } from '../logger';

const serviceName = process.env.SERVICE_NAME || 'echoverse-platform';
const serviceVersion = process.env.SERVICE_VERSION || '1.0.0';
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';

const prometheusExporter = new PrometheusExporter({
  port: 9464,
}, () => {
  logger.info('Prometheus exporter started', { port: 9464 });
});

const traceExporter = new OTLPTraceExporter({
  url: otlpEndpoint,
  headers: {},
});

export const sdk = new NodeSDK({
  resource: {
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
  } as any,
  traceExporter,
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        requestHook: (span, request) => {
          span.setAttribute('http.request.id', (request as any).id || 'unknown');
        },
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-redis': {
        enabled: true,
      },
    }),
  ],
});

export async function initializeOpenTelemetry(): Promise<void> {
  try {
    await sdk.start();
    logger.info('OpenTelemetry SDK initialized', {
      serviceName,
      serviceVersion,
      otlpEndpoint,
    });

    process.on('SIGTERM', async () => {
      try {
        await sdk.shutdown();
        logger.info('OpenTelemetry SDK shut down successfully');
      } catch (error) {
        logger.error('Error shutting down OpenTelemetry SDK', error instanceof Error ? error : undefined);
      }
    });
  } catch (error) {
    logger.error('Failed to initialize OpenTelemetry', error instanceof Error ? error : undefined);
  }
}

export function getActiveSpan() {
  const trace = require('@opentelemetry/api').trace;
  return trace.getActiveSpan();
}

export function setSpanAttribute(key: string, value: string | number | boolean): void {
  const span = getActiveSpan();
  if (span) {
    span.setAttribute(key, value);
  }
}

export function recordSpanEvent(name: string, attributes?: Record<string, any>): void {
  const span = getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}
