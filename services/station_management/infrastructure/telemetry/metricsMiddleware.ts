import { Request, Response, NextFunction } from 'express';
import { httpRequestDurationMs } from './metrics';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const route = req.route?.path ?? req.path;
    httpRequestDurationMs.observe(
      { method: req.method, route, status_code: res.statusCode },
      Date.now() - start,
    );
  });
  next();
}
