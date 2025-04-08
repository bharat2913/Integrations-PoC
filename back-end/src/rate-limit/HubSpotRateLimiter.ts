import { RateLimitManager } from './RateLimitManager.js';
import type { RateLimitHeaders } from './types.js';

export class HubSpotRateLimiter {
  private static instance: HubSpotRateLimiter | null = null;
  private rateLimitManager: RateLimitManager;

  private constructor() {
    this.rateLimitManager = RateLimitManager.getInstance();
    this.initializeHubSpotConfig();
  }

  public static getInstance(): HubSpotRateLimiter {
    if (HubSpotRateLimiter.instance === null) {
      HubSpotRateLimiter.instance = new HubSpotRateLimiter();
    }
    return HubSpotRateLimiter.instance;
  }

  public async checkRateLimit(): Promise<void> {
    await this.rateLimitManager.checkRateLimit('hubspot');
  }

  public updateFromHeaders(headers: RateLimitHeaders): void {
    this.rateLimitManager.updateFromHeaders('hubspot', headers);
  }

  private initializeHubSpotConfig(): void {
    // HubSpot's rate limits (adjust based on your plan)
    this.rateLimitManager.registerIntegration({
      integrationId: 'hubspot',
      maxRequestsPerSecond: 10, // Adjust based on your HubSpot plan
      maxRequestsPerDay: 250000, // Adjust based on your HubSpot plan
      backoffStrategy: 'exponential',
      backoffMultiplier: 2,
    });
  }
}
