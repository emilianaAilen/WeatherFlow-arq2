import { Registry, collectDefaultMetrics, Histogram, Counter } from 'prom-client';

export const register = new Registry();

collectDefaultMetrics({ register });

export const httpRequestDurationMs = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500],
  registers: [register],
});

export const measurementsConsumedTotal = new Counter({
  name: 'measurements_consumed_total',
  help: 'Total measurements consumed from RabbitMQ by result status',
  labelNames: ['status'],
  registers: [register],
});

export const alertsTriggeredTotal = new Counter({
  name: 'alerts_triggered_total',
  help: 'Total climate alerts triggered by type',
  labelNames: ['alert_type'],
  registers: [register],
});

export const dlqMessagesTotal = new Counter({
  name: 'dlq_messages_total',
  help: 'Total messages routed to the dead letter queue',
  registers: [register],
});
