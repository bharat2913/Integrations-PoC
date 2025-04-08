import { RateLimitError, withRateLimitRetry } from '../utils/rateLimitHandler';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3010';

export interface ApiError {
  error: string;
  timestamp?: string;
}

export const apiClient = {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    console.log('Making request to:', `${API_BASE_URL}${endpoint}`);

    return withRateLimitRetry(async () => {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      console.log('Response status:', response.status);
      console.log(
        'Response headers:',
        Object.fromEntries(response.headers.entries())
      );

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const data = (await response.json()) as ApiError;

        console.log('Rate limit response:', {
          retryAfter,
          error: data.error,
          timestamp: data.timestamp,
        });

        throw new RateLimitError(
          data.error || 'Rate limit exceeded',
          retryAfter ? parseInt(retryAfter, 10) : undefined,
          data.timestamp
        );
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = (await response.json()) as T;
      console.log('Request successful');
      return result;
    });
  },
};
