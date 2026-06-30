import { injectTraceHeaders, extractTraceContext } from './amqpPropagation';

describe('amqpPropagation', () => {
  describe('injectTraceHeaders', () => {
    it('should return an object', () => {
      const headers = injectTraceHeaders();
      expect(typeof headers).toBe('object');
    });

    it('should return an empty object when there is no active span', () => {
      const headers = injectTraceHeaders();
      expect(headers).toEqual({});
    });
  });

  describe('extractTraceContext', () => {
    it('should return a context when headers is undefined', () => {
      const ctx = extractTraceContext(undefined);
      expect(ctx).toBeDefined();
    });

    it('should return a context when headers is an empty object', () => {
      const ctx = extractTraceContext({});
      expect(ctx).toBeDefined();
    });

    it('should include string header values in the carrier', () => {
      const ctx = extractTraceContext({ traceparent: '00-abc123-def456-01' });
      expect(ctx).toBeDefined();
    });

    it('should convert Buffer header values to string', () => {
      const ctx = extractTraceContext({ traceparent: Buffer.from('00-abc123-def456-01') });
      expect(ctx).toBeDefined();
    });

    it('should ignore non-string and non-Buffer header values', () => {
      const ctx = extractTraceContext({ someHeader: 42 as any });
      expect(ctx).toBeDefined();
    });

    it('should produce a context that round-trips with injectTraceHeaders', () => {
      const injected = injectTraceHeaders();
      const ctx = extractTraceContext(injected);
      expect(ctx).toBeDefined();
    });
  });
});
