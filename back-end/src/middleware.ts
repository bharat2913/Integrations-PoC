import type { FastifyReply, FastifyRequest } from 'fastify';
import { HubSpotRateLimiter } from './rate-limit/HubSpotRateLimiter.js';
import type { RateLimitError } from './rate-limit/types.js';

export async function rateLimitMiddleware(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const hubspotRateLimiter = HubSpotRateLimiter.getInstance();
    await hubspotRateLimiter.checkRateLimit();
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      'retryAfter' in error
    ) {
      const rateLimitError = error as RateLimitError;
      await reply
        .status(429)
        .header('Retry-After', rateLimitError.retryAfter?.toString() ?? '60')
        .send({
          error: rateLimitError.message,
          timestamp: new Date().toISOString(),
        });
      return;
    }
    throw error;
  }
}
