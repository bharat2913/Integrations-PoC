import { Client } from '@hubspot/api-client';
import { HubSpotRateLimiter } from './HubSpotRateLimiter.js';
import { updateRateLimitFromResponse } from './middleware.js';
import { RateLimitError } from './RateLimitError.js';

interface HubSpotResponse {
  headers?: Record<string, string>;
}

interface HubSpotError extends Error {
  headers?: Record<string, string>;
}

interface TaskInput {
  properties: Record<string, string>;
  associations?: Array<{
    to: { id: string };
    types: Array<{
      associationCategory:
        | 'HUBSPOT_DEFINED'
        | 'USER_DEFINED'
        | 'INTEGRATOR_DEFINED';
      associationTypeId: number;
    }>;
  }>;
}

export class HubSpotClientWrapper {
  private client: Client;
  private rateLimiter: HubSpotRateLimiter;

  constructor(accessToken: string) {
    this.client = new Client({ accessToken });
    this.rateLimiter = HubSpotRateLimiter.getInstance();
  }

  async crmContactsGetPage(limit: number) {
    return this.handleRateLimit(() =>
      this.client.crm.contacts.basicApi.getPage(limit)
    );
  }

  async crmTasksCreate(taskData: TaskInput) {
    return this.handleRateLimit(() =>
      this.client.crm.objects.tasks.basicApi.create(taskData as any)
    );
  }

  private async handleRateLimit<T>(operation: () => Promise<T>): Promise<T> {
    try {
      await this.rateLimiter.checkRateLimit();
      const response = await operation();

      if (typeof response === 'object' && response !== null) {
        const hubspotResponse = response as HubSpotResponse;
        if (hubspotResponse.headers) {
          updateRateLimitFromResponse(hubspotResponse.headers);
        }
      }

      return response;
    } catch (error) {
      // If it's already a RateLimitError, propagate it
      if (error instanceof RateLimitError) {
        throw error;
      }

      // If it's a HubSpot error with headers, update rate limits
      if (error && typeof error === 'object') {
        const hubspotError = error as HubSpotError;
        if (hubspotError.headers) {
          updateRateLimitFromResponse(hubspotError.headers);
        }
      }

      // If it's a HubSpot rate limit error, convert it to our RateLimitError
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status?: number }).status;
        if (status === 429) {
          const retryAfter =
            (error as { headers?: { 'retry-after'?: string } }).headers?.[
              'retry-after'
            ] ?? '60';
          throw new RateLimitError(
            'HubSpot rate limit exceeded',
            parseInt(retryAfter, 10),
            'hubspot'
          );
        }
      }

      throw error;
    }
  }
}
