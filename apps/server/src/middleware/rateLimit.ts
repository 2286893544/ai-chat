import type { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

interface RateRecord {
  windowStart: number;
  count: number;
}

export function createRateLimitMiddleware(options: RateLimitOptions) {
  const records = new Map<string, RateRecord>();

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const now = Date.now();
    const key = `${req.ip || req.socket.remoteAddress || 'unknown'}:${req.path}`;
    const current = records.get(key);

    if (!current || now - current.windowStart >= options.windowMs) {
      records.set(key, { windowStart: now, count: 1 });
      next();
      return;
    }

    current.count += 1;
    if (current.count > options.max) {
      res.status(429).json({
        ok: false,
        code: 'DEEPSEEK_RATE_LIMITED',
        message: 'Too many requests. Please wait and try again.',
      });
      return;
    }

    next();
  };
}
