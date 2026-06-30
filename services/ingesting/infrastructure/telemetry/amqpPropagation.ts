import { propagation, context, Context } from '@opentelemetry/api';

export function injectTraceHeaders(): Record<string, string> {
  const carrier: Record<string, string> = {};
  propagation.inject(context.active(), carrier);
  return carrier;
}

export function extractTraceContext(headers: Record<string, unknown> | undefined): Context {
  const carrier: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers ?? {})) {
    if (typeof v === 'string') carrier[k] = v;
    else if (Buffer.isBuffer(v)) carrier[k] = v.toString();
  }
  return propagation.extract(context.active(), carrier);
}
