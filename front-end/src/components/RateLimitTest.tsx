import { useState } from 'react';
import { apiClient } from '../api/client';
import { handleRateLimitError } from '../utils/rateLimitHandler';

interface RateLimitErrorResponse {
  error: 'rate_limit_exceeded';
  retryAfter: number;
  message: string;
}

export function RateLimitTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const testRateLimit = async () => {
    setLoading(true);
    setError(null);
    setSuccessCount(0);
    setAttempts((prev) => prev + 1);

    try {
      console.log('Starting rate limit test...');

      // Make 20 concurrent requests to test rate limiting
      const requests = Array(20)
        .fill(null)
        .map(() => apiClient.request<unknown[]>('/api/hubspot/contacts'));

      const results = await Promise.allSettled(requests);

      const successfulRequests = results.filter(
        (result): result is PromiseFulfilledResult<unknown[]> =>
          result.status === 'fulfilled'
      );

      const failedRequests = results.filter(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected'
      );

      console.log('Test completed:', {
        successful: successfulRequests.length,
        failed: failedRequests.length,
      });

      setSuccessCount(successfulRequests.length);

      if (failedRequests.length > 0) {
        const rateLimitErrors = failedRequests.filter((result) => {
          try {
            const error = JSON.parse(
              result.reason.message
            ) as RateLimitErrorResponse;
            return error.error === 'rate_limit_exceeded';
          } catch {
            return false;
          }
        });

        if (rateLimitErrors.length > 0) {
          console.log('Rate limit errors detected:', rateLimitErrors.length);
          const error = JSON.parse(
            rateLimitErrors[0].reason.message
          ) as RateLimitErrorResponse;
          setError(
            `Rate limit hit: ${error.message} (Retry after ${error.retryAfter}ms)`
          );
        } else {
          setError(`Some requests failed: ${failedRequests.length} errors`);
        }
      }
    } catch (err) {
      console.error('Test failed:', err);
      if (!handleRateLimitError(err)) {
        setError(
          err instanceof Error ? err.message : 'An unexpected error occurred'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-lg font-semibold">Rate Limiter Test</h2>

      <button
        onClick={testRateLimit}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Testing Rate Limits...' : 'Test Rate Limits'}
      </button>

      <div className="space-y-2">
        {successCount > 0 && (
          <p className="text-green-600">
            Successfully completed {successCount} requests
          </p>
        )}

        {error && <p className="text-red-500">Error: {error}</p>}

        <p className="text-sm text-gray-500">
          Attempt {attempts} - This test makes 20 concurrent requests to the
          HubSpot API to test rate limiting
        </p>
      </div>
    </div>
  );
}
