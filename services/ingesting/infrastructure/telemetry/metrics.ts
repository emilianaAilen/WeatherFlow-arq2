import { Registry, collectDefaultMetrics, Histogram, Counter, Gauge } from 'prom-client';

export const register = new Registry();

collectDefaultMetrics({ register });

export const httpRequestDurationMs = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500],
  registers: [register],
});

export const owmFetchTotal = new Counter({
  name: 'owm_fetch_total',
  help: 'Total OWM API fetch attempts by result status',
  labelNames: ['status'],
  registers: [register],
});

export const measurementsIngestedTotal = new Counter({
  name: 'measurements_ingested_total',
  help: 'Total measurements published to the ingested-measurements exchange',
  registers: [register],
});

export const ingestionCycleDurationMs = new Histogram({
  name: 'ingestion_cycle_duration_ms',
  help: 'Duration of one full ingestion cron cycle in milliseconds',
  buckets: [100, 500, 1000, 3000, 5000, 10000, 30000],
  registers: [register],
});

export const owmCircuitBreakerState = new Gauge({
  name: 'owm_circuit_breaker_state',
  help: 'OWM circuit breaker state: 0=CLOSED, 1=OPEN, 2=HALF_OPEN',
  registers: [register],
});
