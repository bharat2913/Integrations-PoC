export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010';

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
} as const;

export const MAX_RETRIES = 3;
export const MAX_RETRY_DELAY = 30000; // 30 seconds
