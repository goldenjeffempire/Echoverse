
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { config } from '../config';

let sdk: NodeSDK | null = null;

export function initializeTracing() {
  if (!config.tracingEnabled) {
    return;
  }

  const prometheusExporter = new PrometheusExporter({
    port: config.metricsPort,
    endpoint: config.metricsPath
  });

  sdk = new NodeSDK({
    serviceName: 'echoverse-platform',
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
      }),
    ],
  });

  sdk.start();
  // OpenTelemetry tracing initialized
}

export function shutdownTracing() {
  if (sdk) {
    return sdk.shutdown();
  }
  return Promise.resolve();
}

process.on('SIGTERM', () => {
  shutdownTracing()
    .then(() => {
      // Tracing terminated
    })
    .catch((error) => {
      // Error terminating tracing
    })
    .finally(() => process.exit(0));
});
