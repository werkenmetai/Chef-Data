/**
 * Rate Limiter for Exact Online API
 *
 * Implements request throttling to stay within API limits:
 * - 60 requests per minute (per API key)
 * - Daily limits vary by plan
 *
 * @see docs/knowledge/exact/VERSION.md
 */

import { logger } from '../lib/logger';

export interface RateLimitInfo {
  minutelyLimit: number;
  minutelyRemaining: number;
  minutelyReset: Date;
  dailyLimit: number;
  dailyRemaining: number;
  dailyReset: Date;
}

export interface RateLimiterConfig {
  maxRequestsPerMinute?: number;
  maxRetries?: number;
  baseRetryDelayMs?: number;
}

const DEFAULT_CONFIG: Required<RateLimiterConfig> = {
  maxRequestsPerMinute: 60,
  maxRetries: 3,
  baseRetryDelayMs: 1000,
};

export class RateLimiter {
  private requestTimestamps: number[] = [];
  private readonly windowMs = 60_000; // 1 minute
  private readonly maxRequests: number;
  private readonly maxRetries: number;
  private readonly baseRetryDelayMs: number;
  private currentLimitInfo: RateLimitInfo | null = null;

  constructor(config: RateLimiterConfig = {}) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    this.maxRequests = mergedConfig.maxRequestsPerMinute;
    this.maxRetries = mergedConfig.maxRetries;
    this.baseRetryDelayMs = mergedConfig.baseRetryDelayMs;
  }

  /**
   * Wait if necessary to stay within rate limits.
   * Call this before making each API request.
   */
  async throttle(): Promise<void> {
    const now = Date.now();

    // Remove timestamps outside the current window
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    // Check server-reported remaining (if available)
    if (this.currentLimitInfo && this.currentLimitInfo.minutelyRemaining <= 0) {
      const waitTime = this.currentLimitInfo.minutelyReset.getTime() - now;
      if (waitTime > 0) {
        await this.sleep(waitTime);
        return;
      }
    }

    // Check local tracking
    if (this.requestTimestamps.length >= this.maxRequests) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = this.windowMs - (now - oldestTimestamp);

      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
    }

    // Record this request
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Parse rate limit headers from API response
   */
  parseRateLimitHeaders(headers: Headers): RateLimitInfo {
    const info: RateLimitInfo = {
      minutelyLimit: this.parseHeader(headers, 'X-RateLimit-Minutely-Limit', 60),
      minutelyRemaining: this.parseHeader(headers, 'X-RateLimit-Minutely-Remaining', 0),
      minutelyReset: new Date(this.parseHeader(headers, 'X-RateLimit-Minutely-Reset', 0) * 1000),
      dailyLimit: this.parseHeader(headers, 'X-RateLimit-Limit', 5000),
      dailyRemaining: this.parseHeader(headers, 'X-RateLimit-Remaining', 0),
      dailyReset: new Date(this.parseHeader(headers, 'X-RateLimit-Reset', 0) * 1000),
    };

    this.currentLimitInfo = info;
    return info;
  }

  /**
   * Check if we're approaching rate limits
   */
  isApproachingLimit(threshold = 0.1): boolean {
    if (!this.currentLimitInfo) {
      // Fall back to local tracking
      return this.requestTimestamps.length >= this.maxRequests * (1 - threshold);
    }

    const minutelyRatio =
      this.currentLimitInfo.minutelyRemaining / this.currentLimitInfo.minutelyLimit;
    const dailyRatio =
      this.currentLimitInfo.dailyRemaining / this.currentLimitInfo.dailyLimit;

    return minutelyRatio < threshold || dailyRatio < threshold;
  }

  /**
   * Execute a request with automatic retry on rate limit errors
   */
  async executeWithRetry<T>(
    requestFn: () => Promise<Response>,
    handleResponse: (response: Response) => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      await this.throttle();

      try {
        const response = await requestFn();

        // Parse rate limit headers from every response
        this.parseRateLimitHeaders(response.headers);

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : this.calculateBackoff(attempt);

          logger.warn('Rate limited, waiting before retry', {
            attempt: attempt + 1,
            maxRetries: this.maxRetries,
            waitMs: waitTime,
          });

          await this.sleep(waitTime);
          continue;
        }

        return await handleResponse(response);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Only retry on network errors, not application errors
        if (attempt < this.maxRetries - 1 && this.isRetryableError(error)) {
          const waitTime = this.calculateBackoff(attempt);
          logger.warn('Request failed, retrying', {
            attempt: attempt + 1,
            maxRetries: this.maxRetries,
            waitMs: waitTime,
          });
          await this.sleep(waitTime);
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Get current rate limit status
   */
  getStatus(): {
    localRequestCount: number;
    serverInfo: RateLimitInfo | null;
    isApproachingLimit: boolean;
  } {
    return {
      localRequestCount: this.requestTimestamps.length,
      serverInfo: this.currentLimitInfo,
      isApproachingLimit: this.isApproachingLimit(),
    };
  }

  /**
   * Reset the rate limiter state (useful for testing)
   */
  reset(): void {
    this.requestTimestamps = [];
    this.currentLimitInfo = null;
  }

  private parseHeader(headers: Headers, name: string, defaultValue: number): number {
    const value = headers.get(name);
    return value ? parseInt(value, 10) : defaultValue;
  }

  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return this.baseRetryDelayMs * Math.pow(2, attempt);
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Network errors are typically retryable
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('econnreset') ||
        message.includes('econnrefused')
      );
    }
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
