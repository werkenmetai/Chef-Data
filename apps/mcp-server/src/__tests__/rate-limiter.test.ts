/**
 * Rate Limiter Tests
 *
 * Tests for the RateLimiter class including:
 * - Rate limit tracking per API key
 * - Sliding window behavior
 * - Limit exceeded responses
 * - Reset after window
 * - Concurrent request handling
 * - Retry logic with exponential backoff
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from '../exact/rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Constructor and Initialization', () => {
    it('should create a RateLimiter with default config', () => {
      const limiter = new RateLimiter();
      const status = limiter.getStatus();

      expect(status.localRequestCount).toBe(0);
      expect(status.serverInfo).toBeNull();
      expect(status.isApproachingLimit).toBe(false);
    });

    it('should create a RateLimiter with custom maxRequestsPerMinute', () => {
      const limiter = new RateLimiter({ maxRequestsPerMinute: 30 });
      const status = limiter.getStatus();

      expect(status.localRequestCount).toBe(0);
    });

    it('should create a RateLimiter with custom maxRetries', () => {
      const limiter = new RateLimiter({ maxRetries: 5 });
      // Verify by testing retry behavior
      expect(limiter).toBeInstanceOf(RateLimiter);
    });

    it('should create a RateLimiter with custom baseRetryDelayMs', () => {
      const limiter = new RateLimiter({ baseRetryDelayMs: 2000 });
      expect(limiter).toBeInstanceOf(RateLimiter);
    });

    it('should merge partial config with defaults', () => {
      const limiter = new RateLimiter({ maxRequestsPerMinute: 30 });
      expect(limiter).toBeInstanceOf(RateLimiter);
    });
  });

  describe('throttle()', () => {
    it('should record request timestamps', async () => {
      const limiter = new RateLimiter();

      await limiter.throttle();
      const status = limiter.getStatus();

      expect(status.localRequestCount).toBe(1);
    });

    it('should allow requests within limit', async () => {
      const limiter = new RateLimiter({ maxRequestsPerMinute: 5 });

      for (let i = 0; i < 5; i++) {
        await limiter.throttle();
      }

      const status = limiter.getStatus();
      expect(status.localRequestCount).toBe(5);
    });

    it('should track that limit is reached before waiting', async () => {
      const limiter = new RateLimiter({ maxRequestsPerMinute: 2 });

      // Make 2 requests
      await limiter.throttle();
      await limiter.throttle();

      // Should have 2 requests tracked
      expect(limiter.getStatus().localRequestCount).toBe(2);

      // Third request should start waiting (we won't complete it to avoid timing issues)
      // Instead, verify that isApproachingLimit returns true
      expect(limiter.isApproachingLimit(0.1)).toBe(true);
    });

    it('should use sliding window - old requests expire', async () => {
      const limiter = new RateLimiter({ maxRequestsPerMinute: 3 });

      // Make 3 requests
      await limiter.throttle();
      await limiter.throttle();
      await limiter.throttle();

      expect(limiter.getStatus().localRequestCount).toBe(3);

      // Advance time by more than 1 minute
      vi.advanceTimersByTime(61000);

      // New request should not wait (old ones expired)
      await limiter.throttle();

      // Only the new request should be counted
      expect(limiter.getStatus().localRequestCount).toBe(1);
    });

    it('should respect server-reported remaining count by tracking server info', () => {
      const limiter = new RateLimiter();
      const now = Date.now();

      // Simulate server saying we're out of requests
      const headers = new Headers({
        'X-RateLimit-Minutely-Limit': '60',
        'X-RateLimit-Minutely-Remaining': '0',
        'X-RateLimit-Minutely-Reset': String(Math.floor(now / 1000) + 30),
        'X-RateLimit-Limit': '5000',
        'X-RateLimit-Remaining': '4990',
        'X-RateLimit-Reset': String(Math.floor(now / 1000) + 86400),
      });

      limiter.parseRateLimitHeaders(headers);

      // Server info should be tracked
      const status = limiter.getStatus();
      expect(status.serverInfo).not.toBeNull();
      expect(status.serverInfo!.minutelyRemaining).toBe(0);

      // isApproachingLimit should return true when server reports 0 remaining
      expect(limiter.isApproachingLimit(0.1)).toBe(true);
    });
  });

  describe('parseRateLimitHeaders()', () => {
    it('should parse all rate limit headers correctly', () => {
      const limiter = new RateLimiter();
      const now = Date.now();

      const headers = new Headers({
        'X-RateLimit-Minutely-Limit': '60',
        'X-RateLimit-Minutely-Remaining': '55',
        'X-RateLimit-Minutely-Reset': String(Math.floor(now / 1000) + 45),
        'X-RateLimit-Limit': '5000',
        'X-RateLimit-Remaining': '4500',
        'X-RateLimit-Reset': String(Math.floor(now / 1000) + 86400),
      });

      const info = limiter.parseRateLimitHeaders(headers);

      expect(info.minutelyLimit).toBe(60);
      expect(info.minutelyRemaining).toBe(55);
      expect(info.dailyLimit).toBe(5000);
      expect(info.dailyRemaining).toBe(4500);
    });

    it('should use defaults for missing headers', () => {
      const limiter = new RateLimiter();
      const headers = new Headers();

      const info = limiter.parseRateLimitHeaders(headers);

      expect(info.minutelyLimit).toBe(60);
      expect(info.minutelyRemaining).toBe(0);
      expect(info.dailyLimit).toBe(5000);
      expect(info.dailyRemaining).toBe(0);
    });

    it('should update internal state with parsed info', () => {
      const limiter = new RateLimiter();

      const headers = new Headers({
        'X-RateLimit-Minutely-Limit': '60',
        'X-RateLimit-Minutely-Remaining': '40',
        'X-RateLimit-Minutely-Reset': String(Math.floor(Date.now() / 1000) + 45),
        'X-RateLimit-Limit': '5000',
        'X-RateLimit-Remaining': '4000',
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 86400),
      });

      limiter.parseRateLimitHeaders(headers);

      const status = limiter.getStatus();
      expect(status.serverInfo).not.toBeNull();
      expect(status.serverInfo!.minutelyRemaining).toBe(40);
      expect(status.serverInfo!.dailyRemaining).toBe(4000);
    });

    it('should convert reset timestamps to Date objects', () => {
      const limiter = new RateLimiter();
      const resetTimestamp = Math.floor(Date.now() / 1000) + 60;

      const headers = new Headers({
        'X-RateLimit-Minutely-Reset': String(resetTimestamp),
        'X-RateLimit-Reset': String(resetTimestamp + 3600),
      });

      const info = limiter.parseRateLimitHeaders(headers);

      expect(info.minutelyReset).toBeInstanceOf(Date);
      expect(info.minutelyReset.getTime()).toBe(resetTimestamp * 1000);
    });
  });

  describe('isApproachingLimit()', () => {
    it('should return false when well under limit', () => {
      const limiter = new RateLimiter({ maxRequestsPerMinute: 60 });

      // No requests made
      expect(limiter.isApproachingLimit()).toBe(false);
    });

    it('should return true when approaching local limit (90% threshold)', async () => {
      const limiter = new RateLimiter({ maxRequestsPerMinute: 10 });

      // Make 9 requests (90% of limit)
      for (let i = 0; i < 9; i++) {
        await limiter.throttle();
      }

      expect(limiter.isApproachingLimit(0.1)).toBe(true);
    });

    it('should return true when server reports low minutely remaining', () => {
      const limiter = new RateLimiter();

      const headers = new Headers({
        'X-RateLimit-Minutely-Limit': '60',
        'X-RateLimit-Minutely-Remaining': '5', // 8.3% remaining
        'X-RateLimit-Minutely-Reset': String(Math.floor(Date.now() / 1000) + 30),
        'X-RateLimit-Limit': '5000',
        'X-RateLimit-Remaining': '4000',
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 86400),
      });

      limiter.parseRateLimitHeaders(headers);

      expect(limiter.isApproachingLimit(0.1)).toBe(true);
    });

    it('should return true when server reports low daily remaining', () => {
      const limiter = new RateLimiter();

      const headers = new Headers({
        'X-RateLimit-Minutely-Limit': '60',
        'X-RateLimit-Minutely-Remaining': '50', // 83% remaining
        'X-RateLimit-Minutely-Reset': String(Math.floor(Date.now() / 1000) + 30),
        'X-RateLimit-Limit': '5000',
        'X-RateLimit-Remaining': '400', // 8% remaining
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 86400),
      });

      limiter.parseRateLimitHeaders(headers);

      expect(limiter.isApproachingLimit(0.1)).toBe(true);
    });

    it('should use custom threshold', async () => {
      const limiter = new RateLimiter({ maxRequestsPerMinute: 10 });

      // Make 7 requests (70% of limit)
      for (let i = 0; i < 7; i++) {
        await limiter.throttle();
      }

      // Should not be approaching with 10% threshold
      expect(limiter.isApproachingLimit(0.1)).toBe(false);

      // Should be approaching with 40% threshold
      expect(limiter.isApproachingLimit(0.4)).toBe(true);
    });
  });

  describe('executeWithRetry()', () => {
    it('should execute successful request without retry', async () => {
      const limiter = new RateLimiter();
      const mockRequestFn = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'X-RateLimit-Minutely-Remaining': '59',
        }),
      });
      const mockHandleResponse = vi.fn().mockResolvedValue({ data: 'success' });

      const result = await limiter.executeWithRetry(mockRequestFn, mockHandleResponse);

      expect(mockRequestFn).toHaveBeenCalledTimes(1);
      expect(mockHandleResponse).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: 'success' });
    });

    it('should retry on 429 rate limit response', async () => {
      const limiter = new RateLimiter({ maxRetries: 3, baseRetryDelayMs: 100 });

      const mockRequestFn = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({
            'Retry-After': '1',
            'X-RateLimit-Minutely-Remaining': '0',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({
            'X-RateLimit-Minutely-Remaining': '59',
          }),
        });

      const mockHandleResponse = vi.fn().mockResolvedValue({ data: 'success' });

      const resultPromise = limiter.executeWithRetry(mockRequestFn, mockHandleResponse);

      // Wait for retry delay
      await vi.advanceTimersByTimeAsync(1500);

      const result = await resultPromise;

      expect(mockRequestFn).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    it('should use Retry-After header when present', async () => {
      const limiter = new RateLimiter({ maxRetries: 3, baseRetryDelayMs: 100 });

      const mockRequestFn = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({
            'Retry-After': '5', // 5 seconds
            'X-RateLimit-Minutely-Remaining': '0',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({
            'X-RateLimit-Minutely-Remaining': '59',
          }),
        });

      const mockHandleResponse = vi.fn().mockResolvedValue({ data: 'success' });

      const resultPromise = limiter.executeWithRetry(mockRequestFn, mockHandleResponse);

      // Advance less than Retry-After
      await vi.advanceTimersByTimeAsync(3000);
      expect(mockRequestFn).toHaveBeenCalledTimes(1);

      // Advance past Retry-After
      await vi.advanceTimersByTimeAsync(3000);

      const result = await resultPromise;
      expect(mockRequestFn).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    it('should use exponential backoff when no Retry-After header', async () => {
      const limiter = new RateLimiter({ maxRetries: 3, baseRetryDelayMs: 1000 });

      const mockRequestFn = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({
            'X-RateLimit-Minutely-Remaining': '0',
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({
            'X-RateLimit-Minutely-Remaining': '0',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({
            'X-RateLimit-Minutely-Remaining': '59',
          }),
        });

      const mockHandleResponse = vi.fn().mockResolvedValue({ data: 'success' });

      const resultPromise = limiter.executeWithRetry(mockRequestFn, mockHandleResponse);

      // First retry: 1000ms (1000 * 2^0)
      await vi.advanceTimersByTimeAsync(1500);
      expect(mockRequestFn).toHaveBeenCalledTimes(2);

      // Second retry: 2000ms (1000 * 2^1)
      await vi.advanceTimersByTimeAsync(2500);

      const result = await resultPromise;
      expect(mockRequestFn).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
    });

    it('should retry on network errors', async () => {
      const limiter = new RateLimiter({ maxRetries: 3, baseRetryDelayMs: 100 });

      const mockRequestFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({
            'X-RateLimit-Minutely-Remaining': '59',
          }),
        });

      const mockHandleResponse = vi.fn().mockResolvedValue({ data: 'success' });

      const resultPromise = limiter.executeWithRetry(mockRequestFn, mockHandleResponse);

      await vi.advanceTimersByTimeAsync(500);

      const result = await resultPromise;
      expect(mockRequestFn).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    it('should retry on timeout errors', async () => {
      const limiter = new RateLimiter({ maxRetries: 3, baseRetryDelayMs: 100 });

      const mockRequestFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Request timeout'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({
            'X-RateLimit-Minutely-Remaining': '59',
          }),
        });

      const mockHandleResponse = vi.fn().mockResolvedValue({ data: 'success' });

      const resultPromise = limiter.executeWithRetry(mockRequestFn, mockHandleResponse);

      await vi.advanceTimersByTimeAsync(500);

      const result = await resultPromise;
      expect(mockRequestFn).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    it('should retry on ECONNRESET errors', async () => {
      const limiter = new RateLimiter({ maxRetries: 3, baseRetryDelayMs: 100 });

      const mockRequestFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({
            'X-RateLimit-Minutely-Remaining': '59',
          }),
        });

      const mockHandleResponse = vi.fn().mockResolvedValue({ data: 'success' });

      const resultPromise = limiter.executeWithRetry(mockRequestFn, mockHandleResponse);

      await vi.advanceTimersByTimeAsync(500);

      const result = await resultPromise;
      expect(mockRequestFn).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    it('should retry on ECONNREFUSED errors', async () => {
      const limiter = new RateLimiter({ maxRetries: 3, baseRetryDelayMs: 100 });

      const mockRequestFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({
            'X-RateLimit-Minutely-Remaining': '59',
          }),
        });

      const mockHandleResponse = vi.fn().mockResolvedValue({ data: 'success' });

      const resultPromise = limiter.executeWithRetry(mockRequestFn, mockHandleResponse);

      await vi.advanceTimersByTimeAsync(500);

      const result = await resultPromise;
      expect(mockRequestFn).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    it('should NOT retry on non-retryable errors', async () => {
      const limiter = new RateLimiter({ maxRetries: 3, baseRetryDelayMs: 100 });

      const mockRequestFn = vi.fn().mockRejectedValue(new Error('Invalid JSON'));
      const mockHandleResponse = vi.fn();

      await expect(limiter.executeWithRetry(mockRequestFn, mockHandleResponse)).rejects.toThrow(
        'Invalid JSON'
      );

      expect(mockRequestFn).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries exhausted', async () => {
      vi.useRealTimers(); // Use real timers for this test
      const limiter = new RateLimiter({ maxRetries: 2, baseRetryDelayMs: 10 }); // Very short delay

      const mockRequestFn = vi.fn().mockRejectedValue(new Error('Network error'));
      const mockHandleResponse = vi.fn();

      await expect(limiter.executeWithRetry(mockRequestFn, mockHandleResponse)).rejects.toThrow(
        'Network error'
      );
      expect(mockRequestFn).toHaveBeenCalledTimes(2);

      vi.useFakeTimers(); // Restore fake timers
    });

    it('should throw "Max retries exceeded" if no error was captured', async () => {
      vi.useRealTimers(); // Use real timers for this test
      const limiter = new RateLimiter({ maxRetries: 2, baseRetryDelayMs: 10 }); // Very short delay

      const mockRequestFn = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({
          'X-RateLimit-Minutely-Remaining': '0',
        }),
      });
      const mockHandleResponse = vi.fn();

      await expect(limiter.executeWithRetry(mockRequestFn, mockHandleResponse)).rejects.toThrow(
        'Max retries exceeded'
      );

      vi.useFakeTimers(); // Restore fake timers
    });
  });

  describe('getStatus()', () => {
    it('should return initial status correctly', () => {
      const limiter = new RateLimiter();
      const status = limiter.getStatus();

      expect(status.localRequestCount).toBe(0);
      expect(status.serverInfo).toBeNull();
      expect(status.isApproachingLimit).toBe(false);
    });

    it('should update localRequestCount after throttle', async () => {
      const limiter = new RateLimiter();

      await limiter.throttle();
      await limiter.throttle();
      await limiter.throttle();

      const status = limiter.getStatus();
      expect(status.localRequestCount).toBe(3);
    });

    it('should include serverInfo after parsing headers', () => {
      const limiter = new RateLimiter();

      const headers = new Headers({
        'X-RateLimit-Minutely-Limit': '60',
        'X-RateLimit-Minutely-Remaining': '45',
        'X-RateLimit-Minutely-Reset': String(Math.floor(Date.now() / 1000) + 30),
        'X-RateLimit-Limit': '5000',
        'X-RateLimit-Remaining': '4500',
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 86400),
      });

      limiter.parseRateLimitHeaders(headers);

      const status = limiter.getStatus();
      expect(status.serverInfo).not.toBeNull();
      expect(status.serverInfo!.minutelyLimit).toBe(60);
      expect(status.serverInfo!.minutelyRemaining).toBe(45);
    });

    it('should reflect isApproachingLimit correctly', async () => {
      const limiter = new RateLimiter({ maxRequestsPerMinute: 10 });

      // Initially not approaching
      expect(limiter.getStatus().isApproachingLimit).toBe(false);

      // Make 9 requests (90%)
      for (let i = 0; i < 9; i++) {
        await limiter.throttle();
      }

      expect(limiter.getStatus().isApproachingLimit).toBe(true);
    });
  });

  describe('reset()', () => {
    it('should reset request timestamps', async () => {
      const limiter = new RateLimiter();

      await limiter.throttle();
      await limiter.throttle();
      await limiter.throttle();

      expect(limiter.getStatus().localRequestCount).toBe(3);

      limiter.reset();

      expect(limiter.getStatus().localRequestCount).toBe(0);
    });

    it('should reset server info', () => {
      const limiter = new RateLimiter();

      const headers = new Headers({
        'X-RateLimit-Minutely-Limit': '60',
        'X-RateLimit-Minutely-Remaining': '45',
        'X-RateLimit-Minutely-Reset': String(Math.floor(Date.now() / 1000) + 30),
        'X-RateLimit-Limit': '5000',
        'X-RateLimit-Remaining': '4500',
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 86400),
      });

      limiter.parseRateLimitHeaders(headers);
      expect(limiter.getStatus().serverInfo).not.toBeNull();

      limiter.reset();

      expect(limiter.getStatus().serverInfo).toBeNull();
    });

    it('should allow new requests after reset', async () => {
      const limiter = new RateLimiter({ maxRequestsPerMinute: 2 });

      await limiter.throttle();
      await limiter.throttle();

      expect(limiter.getStatus().localRequestCount).toBe(2);

      limiter.reset();

      // Should allow new requests immediately
      await limiter.throttle();
      expect(limiter.getStatus().localRequestCount).toBe(1);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent throttle calls', async () => {
      const limiter = new RateLimiter({ maxRequestsPerMinute: 10 });

      // Make 5 concurrent throttle calls
      const promises = Array(5)
        .fill(null)
        .map(() => limiter.throttle());

      await Promise.all(promises);

      expect(limiter.getStatus().localRequestCount).toBe(5);
    });

    it('should serialize requests when limit is reached', async () => {
      const limiter = new RateLimiter({ maxRequestsPerMinute: 2 });

      // Make 2 requests
      await limiter.throttle();
      await limiter.throttle();

      // Start 3rd request (should wait)
      const thirdRequest = limiter.throttle();
      let thirdCompleted = false;
      thirdRequest.then(() => {
        thirdCompleted = true;
      });

      // Request should not complete immediately
      await vi.advanceTimersByTimeAsync(100);
      expect(thirdCompleted).toBe(false);

      // After window passes, request should complete
      await vi.advanceTimersByTimeAsync(60000);
      await thirdRequest;
      expect(thirdCompleted).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle string coercion for non-Error exceptions', async () => {
      const limiter = new RateLimiter({ maxRetries: 1, baseRetryDelayMs: 100 });

      const mockRequestFn = vi.fn().mockRejectedValue('string error');
      const mockHandleResponse = vi.fn();

      await expect(limiter.executeWithRetry(mockRequestFn, mockHandleResponse)).rejects.toThrow(
        'string error'
      );
    });

    it('should handle zero remaining requests from server', () => {
      const limiter = new RateLimiter();
      const now = Date.now();

      const headers = new Headers({
        'X-RateLimit-Minutely-Limit': '60',
        'X-RateLimit-Minutely-Remaining': '0',
        'X-RateLimit-Minutely-Reset': String(Math.floor(now / 1000) + 10),
        'X-RateLimit-Limit': '5000',
        'X-RateLimit-Remaining': '4990',
        'X-RateLimit-Reset': String(Math.floor(now / 1000) + 86400),
      });

      limiter.parseRateLimitHeaders(headers);

      // Verify server info is correctly stored
      const status = limiter.getStatus();
      expect(status.serverInfo).not.toBeNull();
      expect(status.serverInfo!.minutelyRemaining).toBe(0);
      expect(status.serverInfo!.minutelyLimit).toBe(60);

      // Should be approaching limit when remaining is 0
      expect(limiter.isApproachingLimit()).toBe(true);
    });

    it('should handle reset time in the past', async () => {
      const limiter = new RateLimiter();

      const headers = new Headers({
        'X-RateLimit-Minutely-Remaining': '0',
        'X-RateLimit-Minutely-Reset': String(Math.floor(Date.now() / 1000) - 10), // Past
      });

      limiter.parseRateLimitHeaders(headers);

      // Throttle should not wait (reset time already passed)
      const start = Date.now();
      await limiter.throttle();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });
});
