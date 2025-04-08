import type { Request, Response, NextFunction } from 'express';
import { HubSpotRateLimiter } from './HubSpotRateLimiter.js';
import type { RateLimitError } from './types.js';

export const rateLimitMiddleware = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const hubspotLimiter = HubSpotRateLimiter.getInstance();
    await hubspotLimiter.checkRateLimit();
    next();
  } catch (error) {
    if (error instanceof Error && 'retryAfter' in error) {
      const rateLimitError = error as RateLimitError;
      res.setHeader(
        'Retry-After',
        rateLimitError.retryAfter?.toString() ?? '60'
      );
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitError.retryAfter,
        message: error.message,
      });
    } else {
      next(error);
    }
  }
};

export const updateRateLimitFromResponse = (
  headers: Record<string, string | string[] | undefined>
): void => {
  const hubspotLimiter = HubSpotRateLimiter.getInstance();
  hubspotLimiter.updateFromHeaders(headers as Record<string, string>);
};
