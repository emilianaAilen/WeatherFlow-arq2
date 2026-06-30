import { Registry, collectDefaultMetrics, Histogram } from 'prom-client';

export const register = new Registry();

collectDefaultMetrics({ register });

export const httpRequestDurationMs = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500],
  registers: [register],
});
