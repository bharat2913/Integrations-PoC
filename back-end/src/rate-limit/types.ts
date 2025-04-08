export type BackoffStrategy = 'exponential' | 'linear' | 'fixed';

export interface RateLimitConfig {
  integrationId: string;
  maxRequestsPerSecond: number;
  maxRequestsPerDay: number;
  retryAfterSeconds?: number;
  backoffStrategy?: BackoffStrategy;
  backoffMultiplier?: number;
}

export interface RateLimitState {
  currentRequests: number;
  lastResetTime: number;
  nextAvailableTime: number;
  dailyRequests: number;
  lastDailyReset: number;
}

export interface RateLimitHeaders {
  'X-RateLimit-Limit'?: string;
  'X-RateLimit-Remaining'?: string;
  'X-RateLimit-Reset'?: string;
  'Retry-After'?: string;
}

export interface RateLimitError extends Error {
  retryAfter?: number;
  integrationId: string;
}
