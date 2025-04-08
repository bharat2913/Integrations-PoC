import type {
  RateLimitConfig,
  RateLimitState,
  RateLimitHeaders,
} from './types.js';
import { RateLimitError as RateLimitErrorClass } from './RateLimitError.js';

export class RateLimitManager {
  private static instance: RateLimitManager | null = null;
  private rateLimits: Map<string, RateLimitState>;
  private configs: Map<string, RateLimitConfig>;

  private constructor() {
    this.rateLimits = new Map();
    this.configs = new Map();
  }

  public static getInstance(): RateLimitManager {
    if (RateLimitManager.instance === null) {
      RateLimitManager.instance = new RateLimitManager();
    }
    return RateLimitManager.instance;
  }

  public registerIntegration(config: RateLimitConfig): void {
    this.configs.set(config.integrationId, config);
    this.initializeState(config.integrationId);
  }

  public checkRateLimit(integrationId: string): void {
    const state = this.rateLimits.get(integrationId);
    const config = this.configs.get(integrationId);

    if (!state || !config) {
      throw new Error(`Integration ${integrationId} not registered`);
    }

    const now = Date.now();
    this.resetIfNeeded(state, now);

    if (state.currentRequests >= config.maxRequestsPerSecond) {
      const retryAfter = Math.ceil((state.nextAvailableTime - now) / 1000);
      throw new RateLimitErrorClass(
        `Rate limit exceeded for ${integrationId}`,
        retryAfter,
        integrationId
      );
    }

    if (state.dailyRequests >= config.maxRequestsPerDay) {
      const retryAfter = Math.ceil((this.getNextDayReset() - now) / 1000);
      throw new RateLimitErrorClass(
        `Daily rate limit exceeded for ${integrationId}`,
        retryAfter,
        integrationId
      );
    }

    state.currentRequests++;
    state.dailyRequests++;
  }

  public updateFromHeaders(
    integrationId: string,
    headers: RateLimitHeaders
  ): void {
    const state = this.rateLimits.get(integrationId);
    if (!state) return;

    const now = Date.now();
    this.resetIfNeeded(state, now);

    if (headers['X-RateLimit-Remaining']) {
      const remaining = parseInt(headers['X-RateLimit-Remaining'], 10);
      state.currentRequests = Math.max(0, state.currentRequests - remaining);
    }

    if (headers['X-RateLimit-Reset']) {
      const resetTime = parseInt(headers['X-RateLimit-Reset'], 10) * 1000;
      state.nextAvailableTime = Math.max(state.nextAvailableTime, resetTime);
    }

    if (headers['Retry-After']) {
      const retryAfter = parseInt(headers['Retry-After'], 10) * 1000;
      state.nextAvailableTime = Math.max(
        state.nextAvailableTime,
        now + retryAfter
      );
    }
  }

  private initializeState(integrationId: string): void {
    const now = Date.now();
    this.rateLimits.set(integrationId, {
      currentRequests: 0,
      lastResetTime: now,
      nextAvailableTime: now,
      dailyRequests: 0,
      lastDailyReset: now,
    });
  }

  private resetIfNeeded(state: RateLimitState, now: number): void {
    if (now - state.lastResetTime >= 1000) {
      state.currentRequests = 0;
      state.lastResetTime = now;
    }

    if (now - state.lastDailyReset >= 24 * 60 * 60 * 1000) {
      state.dailyRequests = 0;
      state.lastDailyReset = now;
    }
  }

  private getNextDayReset(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }
}
