# Exact Online API Rate Limits

Exact Online implements rate limiting to ensure platform stability.

## Rate Limit Structure

Exact Online has two types of rate limits:

| Limit Type | Maximum | Reset Period |
|------------|---------|--------------|
| **Minutely** | 300 requests | 60 seconds |
| **Daily** | Varies by plan | 24 hours (midnight UTC) |

## When Limits Are Exceeded

When you exceed a rate limit, the API returns:

```
HTTP 429 Too Many Requests
```

### Response Headers

The API returns these headers to help you track usage:

```http
X-RateLimit-Minutely-Limit: 300
X-RateLimit-Minutely-Remaining: 42
X-RateLimit-Minutely-Reset: 1609459200

X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4521
X-RateLimit-Reset: 1609459200
```

**Note:** When minutely limit is exceeded, only minutely headers are returned.

## Handling Rate Limits

### Check Before Request

Monitor remaining requests using response headers:

```typescript
interface RateLimitInfo {
  minutelyLimit: number;
  minutelyRemaining: number;
  minutelyReset: Date;
  dailyLimit: number;
  dailyRemaining: number;
  dailyReset: Date;
}

function parseRateLimits(response: Response): RateLimitInfo {
  return {
    minutelyLimit: parseInt(response.headers.get('X-RateLimit-Minutely-Limit') || '300'),
    minutelyRemaining: parseInt(response.headers.get('X-RateLimit-Minutely-Remaining') || '0'),
    minutelyReset: new Date(parseInt(response.headers.get('X-RateLimit-Minutely-Reset') || '0') * 1000),
    dailyLimit: parseInt(response.headers.get('X-RateLimit-Limit') || '5000'),
    dailyRemaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
    dailyReset: new Date(parseInt(response.headers.get('X-RateLimit-Reset') || '0') * 1000),
  };
}
```

### Retry Logic

When you receive a 429 error:

```typescript
async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter
        ? parseInt(retryAfter) * 1000
        : 60000; // Default: 60 seconds

      console.log(`Rate limited. Waiting ${waitTime}ms...`);
      await sleep(waitTime);
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Implementing a Rate Limiter

```typescript
class RateLimiter {
  private requestTimes: number[] = [];
  private readonly windowMs = 60000; // 1 minute
  private readonly maxRequests = 300;

  async throttle(): Promise<void> {
    const now = Date.now();

    // Remove requests outside the window
    this.requestTimes = this.requestTimes.filter(
      time => now - time < this.windowMs
    );

    // If at limit, wait
    if (this.requestTimes.length >= this.maxRequests) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = this.windowMs - (now - oldestRequest);

      if (waitTime > 0) {
        await sleep(waitTime);
      }
    }

    this.requestTimes.push(Date.now());
  }
}

// Usage
const limiter = new RateLimiter();

async function makeRequest(url: string) {
  await limiter.throttle();
  return fetch(url);
}
```

## Best Practices

### 1. Use Bulk Endpoints

For large data exports, use `bulk/*` endpoints which return 1000 records per page instead of 60:

```
GET /api/v1/{division}/bulk/Financial/TransactionLines
```

### 2. Implement Caching

Cache frequently accessed data:

```typescript
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);

  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
  return data;
}
```

### 3. Use Selective Fields

Use `$select` to request only needed fields:

```
GET /api/v1/{division}/crm/Accounts?$select=ID,Name,Code
```

### 4. Batch Related Requests

Instead of making multiple requests, use filters:

```
GET /api/v1/{division}/crm/Accounts?$filter=ID eq guid'...' or ID eq guid'...'
```

### 5. Implement Exponential Backoff

For persistent failures:

```typescript
async function fetchWithBackoff(url: string): Promise<Response> {
  const maxRetries = 5;
  let delay = 1000; // Start with 1 second

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);

      if (response.status !== 429) {
        return response;
      }

      await sleep(delay);
      delay *= 2; // Double the delay

    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(delay);
      delay *= 2;
    }
  }

  throw new Error('Max retries exceeded');
}
```

## Rate Limit by Edition

The daily limit varies by Exact Online edition:

| Edition | Estimated Daily Limit |
|---------|----------------------|
| Standard | ~5,000 |
| Advanced | ~10,000 |
| Ultimate | ~20,000 |

*Note: These are estimates. Check your specific plan with Exact Online.*

## Monitoring API Usage

Track your API usage over time:

```typescript
interface UsageMetrics {
  requestCount: number;
  errorCount: number;
  rateLimitHits: number;
  timestamp: Date;
}

class APIUsageTracker {
  private metrics: UsageMetrics[] = [];

  recordRequest(success: boolean, rateLimited: boolean) {
    const latest = this.getOrCreateLatestMetric();
    latest.requestCount++;
    if (!success) latest.errorCount++;
    if (rateLimited) latest.rateLimitHits++;
  }

  private getOrCreateLatestMetric(): UsageMetrics {
    const now = new Date();
    const hourStart = new Date(now.setMinutes(0, 0, 0));

    let metric = this.metrics.find(
      m => m.timestamp.getTime() === hourStart.getTime()
    );

    if (!metric) {
      metric = {
        requestCount: 0,
        errorCount: 0,
        rateLimitHits: 0,
        timestamp: hourStart,
      };
      this.metrics.push(metric);
    }

    return metric;
  }
}
```

## Error Response Example

When rate limited:

```json
{
  "error": {
    "code": "429",
    "message": {
      "lang": "en-US",
      "value": "Rate limit exceeded. Maximum 300 requests per minute. Please retry after 60 seconds."
    }
  }
}
```

## References

- [Exact Online API Limits Documentation](https://support.exactonline.com/community/s/article/All-All-DNO-Simulation-gen-apilimits)
- [PHP Client Rate Limit Handling](https://github.com/picqer/exact-php-client)
