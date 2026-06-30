import pino from 'pino';
import { trace } from '@opentelemetry/api';

export const logger = pino({
  name: 'ingesting',
  level: process.env.NODE_ENV === 'test' ? 'silent' : (process.env.LOG_LEVEL ?? 'info'),
  mixin() {
    const span = trace.getActiveSpan();
    if (!span) return {};
    const ctx = span.spanContext();
    return { traceId: ctx.traceId, spanId: ctx.spanId };
  },
  ...(process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test' && {
    transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
  }),
});
