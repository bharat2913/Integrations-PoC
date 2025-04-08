export class RateLimitError extends Error {
  public readonly retryAfter: number;
  public readonly integrationId: string;

  constructor(message: string, retryAfter: number, integrationId: string) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.integrationId = integrationId;
  }
}
