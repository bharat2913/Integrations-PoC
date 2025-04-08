import { toast, type ToastOptions } from 'react-hot-toast';

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter?: number,
    public timestamp?: string
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

const toastOptions: ToastOptions = {
  duration: 5000,
  position: 'top-right',
  style: {
    background: '#ef4444',
    color: '#fff',
    padding: '16px',
    borderRadius: '8px',
  },
};

export const handleRateLimitError = (error: unknown): boolean => {
  console.log('Handling error:', error);

  if (error instanceof RateLimitError) {
    console.log('Rate limit error detected:', {
      message: error.message,
      retryAfter: error.retryAfter,
      timestamp: error.timestamp,
    });

    const retryTime = error.retryAfter
      ? `Please try again in ${error.retryAfter} seconds.`
      : 'Please try again later.';

    try {
      toast.error(`Rate limit exceeded. ${retryTime}`, toastOptions);
      return true;
    } catch (toastError) {
      console.error('Failed to show toast:', toastError);
      return true;
    }
  }
  return false;
};

export const withRateLimitRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> => {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1} of ${maxRetries}`);
      return await fn();
    } catch (error) {
      console.log('Error caught:', error);

      if (error instanceof RateLimitError) {
        retries++;
        console.log(`Rate limit hit, retry ${retries} of ${maxRetries}`);

        if (retries === maxRetries) {
          console.log('Max retries reached, throwing error');
          throw error;
        }

        // Exponential backoff with max delay of 30 seconds
        const delay = Math.min(1000 * Math.pow(2, retries), 30000);
        console.log(`Waiting ${delay}ms before retry`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }

  throw new Error('Max retries exceeded');
};
