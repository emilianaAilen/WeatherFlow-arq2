import { metricsMiddleware } from './metricsMiddleware';
import { httpRequestDurationMs } from './metrics';
import { Request, Response, NextFunction } from 'express';

describe('metricsMiddleware', () => {
  let observeSpy: jest.SpyInstance;
  let next: NextFunction;

  const makeReq = (overrides: Partial<Request> = {}): Request =>
    ({ method: 'GET', path: '/test', url: '/test', route: undefined, ...overrides } as unknown as Request);

  const makeRes = (): { res: Response; finish: () => void } => {
    const listeners: Record<string, () => void> = {};
    const res = {
      statusCode: 200,
      on: (event: string, cb: () => void) => { listeners[event] = cb; },
    } as unknown as Response;
    return { res, finish: () => listeners['finish']?.() };
  };

  beforeEach(() => {
    observeSpy = jest.spyOn(httpRequestDurationMs, 'observe').mockImplementation(() => {});
    next = jest.fn();
  });

  afterEach(() => jest.restoreAllMocks());

  it('should call next()', () => {
    const req = makeReq();
    const { res } = makeRes();

    metricsMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should observe duration on res.finish with correct labels', () => {
    const req = makeReq({ method: 'POST', path: '/measurements' });
    const { res, finish } = makeRes();

    metricsMiddleware(req, res, next);
    finish();

    expect(observeSpy).toHaveBeenCalledWith(
      { method: 'POST', route: '/measurements', status_code: 200 },
      expect.any(Number),
    );
  });

  it('should use req.route.path when route is defined', () => {
    const req = makeReq({ method: 'GET', route: { path: '/measurements/:id' } as any });
    const { res, finish } = makeRes();

    metricsMiddleware(req, res, next);
    finish();

    expect(observeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ route: '/measurements/:id' }),
      expect.any(Number),
    );
  });

  it('should fall back to req.path when route is undefined', () => {
    const req = makeReq({ method: 'GET', path: '/health', route: undefined });
    const { res, finish } = makeRes();

    metricsMiddleware(req, res, next);
    finish();

    expect(observeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ route: '/health' }),
      expect.any(Number),
    );
  });

  it('should record the response status code', () => {
    const req = makeReq();
    const { res, finish } = makeRes();
    (res as any).statusCode = 404;

    metricsMiddleware(req, res, next);
    finish();

    expect(observeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status_code: 404 }),
      expect.any(Number),
    );
  });

  it('should not observe until res.finish fires', () => {
    const req = makeReq();
    const { res } = makeRes();

    metricsMiddleware(req, res, next);

    expect(observeSpy).not.toHaveBeenCalled();
  });
});
