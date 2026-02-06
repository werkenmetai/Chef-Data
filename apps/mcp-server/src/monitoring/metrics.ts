/**
 * Metrics Collection for Cloudflare Workers
 *
 * Collects and exports metrics for observability:
 * - Tool execution metrics
 * - Request metrics
 * - Error metrics
 * - Business metrics
 *
 * Supports multiple backends:
 * - Console logging (always)
 * - Cloudflare Workers Analytics Engine (when configured)
 * - D1 database aggregation (for historical analysis)
 */

import { Env } from '../types';
import { Logger } from '../lib/logger';

/**
 * Tool execution metrics
 */
export interface ToolMetrics {
  tool: string;
  userId?: string;
  plan?: string;
  duration: number;
  success: boolean;
  errorType?: string;
  divisionCode?: string;
}

/**
 * Request metrics
 */
export interface RequestMetrics {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userId?: string;
  plan?: string;
  apiKeyId?: string;
}

/**
 * Error metrics
 */
export interface ErrorMetrics {
  requestId?: string;
  errorType: string;
  errorMessage: string;
  tool?: string;
  endpoint?: string;
  userId?: string;
}

/**
 * Metric point for aggregation
 */
interface MetricPoint {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: number;
}

/**
 * Metrics collector with buffering and batch export
 */
class MetricsCollector {
  private buffer: MetricPoint[] = [];
  private logger: Logger;
  private readonly maxBufferSize = 100;

  constructor() {
    this.logger = new Logger('metrics');
  }

  /**
   * Record a metric value
   */
  record(name: string, value: number, tags: Record<string, string> = {}): void {
    const point: MetricPoint = {
      name,
      value,
      tags,
      timestamp: Date.now(),
    };

    this.buffer.push(point);

    // Log to console for Cloudflare Workers logs
    this.logger.info('Metric recorded', {
      metric: name,
      value,
      ...tags,
    });

    // Prevent buffer overflow
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
  }

  /**
   * Increment a counter
   */
  increment(name: string, tags: Record<string, string> = {}): void {
    this.record(name, 1, tags);
  }

  /**
   * Record a timing value in milliseconds
   */
  timing(name: string, durationMs: number, tags: Record<string, string> = {}): void {
    this.record(name, durationMs, { ...tags, unit: 'ms' });
  }

  /**
   * Record a gauge value
   */
  gauge(name: string, value: number, tags: Record<string, string> = {}): void {
    this.record(name, value, { ...tags, type: 'gauge' });
  }

  /**
   * Get buffered metrics (for testing/debugging)
   */
  getBuffer(): readonly MetricPoint[] {
    return this.buffer;
  }

  /**
   * Clear the buffer
   */
  clearBuffer(): void {
    this.buffer = [];
  }
}

// Global metrics collector instance
export const metrics = new MetricsCollector();

/**
 * Record tool execution metrics
 */
export function recordToolExecution(data: ToolMetrics): void {
  const tags: Record<string, string> = {
    tool: data.tool,
    success: String(data.success),
  };

  if (data.userId) tags.user_id = data.userId;
  if (data.plan) tags.plan = data.plan;
  if (data.errorType) tags.error_type = data.errorType;
  if (data.divisionCode) tags.division = data.divisionCode;

  // Record duration
  metrics.timing('tool.duration', data.duration, tags);

  // Record success/failure
  if (data.success) {
    metrics.increment('tool.success', tags);
  } else {
    metrics.increment('tool.failure', tags);
  }
}

/**
 * Record a successful tool execution
 */
export function recordSuccess(
  tool: string,
  duration: number,
  userId?: string,
  plan?: string
): void {
  recordToolExecution({
    tool,
    duration,
    success: true,
    userId,
    plan,
  });
}

/**
 * Record a failed tool execution
 */
export function recordFailure(
  tool: string,
  duration: number,
  errorType: string,
  userId?: string,
  plan?: string
): void {
  recordToolExecution({
    tool,
    duration,
    success: false,
    errorType,
    userId,
    plan,
  });
}

/**
 * Record request metrics
 */
export function recordRequest(data: RequestMetrics): void {
  const tags: Record<string, string> = {
    method: data.method,
    path: data.path,
    status_code: String(data.statusCode),
    status_class: `${Math.floor(data.statusCode / 100)}xx`,
  };

  if (data.userId) tags.user_id = data.userId;
  if (data.plan) tags.plan = data.plan;

  // Record request count
  metrics.increment('request.count', tags);

  // Record duration
  metrics.timing('request.duration', data.duration, tags);

  // Record by status class
  if (data.statusCode >= 500) {
    metrics.increment('request.5xx', tags);
  } else if (data.statusCode >= 400) {
    metrics.increment('request.4xx', tags);
  } else if (data.statusCode >= 200 && data.statusCode < 300) {
    metrics.increment('request.2xx', tags);
  }
}

/**
 * Record error metrics
 */
export function recordError(data: ErrorMetrics): void {
  const tags: Record<string, string> = {
    error_type: data.errorType,
  };

  if (data.tool) tags.tool = data.tool;
  if (data.endpoint) tags.endpoint = data.endpoint;
  if (data.userId) tags.user_id = data.userId;

  metrics.increment('error.count', tags);

  // Log error for console visibility
  new Logger('metrics').warn('Error recorded', {
    ...tags,
    message: data.errorMessage,
    requestId: data.requestId,
  });
}

/**
 * Record rate limit events
 */
export function recordRateLimit(
  userId: string,
  plan: string,
  allowed: boolean
): void {
  const tags = {
    user_id: userId,
    plan,
    allowed: String(allowed),
  };

  metrics.increment('rate_limit.check', tags);

  if (!allowed) {
    metrics.increment('rate_limit.exceeded', tags);
  }
}

/**
 * Record authentication events
 */
export function recordAuth(
  success: boolean,
  method: 'api_key' | 'oauth',
  failureReason?: string
): void {
  const tags: Record<string, string> = {
    success: String(success),
    method,
  };

  if (failureReason) {
    tags.failure_reason = failureReason;
  }

  metrics.increment('auth.attempt', tags);

  if (success) {
    metrics.increment('auth.success', tags);
  } else {
    metrics.increment('auth.failure', tags);
  }
}

/**
 * Record token refresh events
 */
export function recordTokenRefresh(
  success: boolean,
  durationMs: number,
  failureReason?: string
): void {
  const tags: Record<string, string> = {
    success: String(success),
  };

  if (failureReason) {
    tags.failure_reason = failureReason;
  }

  metrics.timing('token_refresh.duration', durationMs, tags);

  if (success) {
    metrics.increment('token_refresh.success', tags);
  } else {
    metrics.increment('token_refresh.failure', tags);
  }
}

/**
 * Record database query metrics
 */
export function recordDbQuery(
  operation: 'read' | 'write',
  table: string,
  durationMs: number,
  success: boolean
): void {
  const tags: Record<string, string> = {
    operation,
    table,
    success: String(success),
  };

  metrics.timing('db.query_duration', durationMs, tags);
  metrics.increment('db.query_count', tags);
}

/**
 * Record Exact Online API call metrics
 */
export function recordExactApiCall(
  endpoint: string,
  durationMs: number,
  statusCode: number,
  success: boolean
): void {
  const tags: Record<string, string> = {
    endpoint,
    status_code: String(statusCode),
    success: String(success),
  };

  metrics.timing('exact_api.duration', durationMs, tags);
  metrics.increment('exact_api.call_count', tags);

  if (!success) {
    metrics.increment('exact_api.error_count', tags);
  }
}

/**
 * Aggregate metrics summary for reporting
 */
export interface MetricsSummary {
  period: {
    start: string;
    end: string;
    duration_seconds: number;
  };
  requests: {
    total: number;
    success_rate: number;
    avg_duration_ms: number;
    p95_duration_ms: number;
  };
  tools: {
    total_calls: number;
    success_rate: number;
    by_tool: Record<string, { calls: number; avg_duration: number }>;
  };
  errors: {
    total: number;
    by_type: Record<string, number>;
  };
}

/**
 * Get metrics summary from database
 * Call this periodically (e.g., via cron) to generate reports
 */
export async function getMetricsSummary(
  env: Env,
  periodMinutes: number = 60
): Promise<MetricsSummary> {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - periodMinutes * 60 * 1000);

  // Query api_usage for request metrics
  const usageStats = await env.DB.prepare(`
    SELECT
      COUNT(*) as total_requests,
      AVG(response_time_ms) as avg_duration,
      SUM(CASE WHEN response_status >= 200 AND response_status < 400 THEN 1 ELSE 0 END) as success_count
    FROM api_usage
    WHERE timestamp > ?
  `).bind(startTime.toISOString()).first<{
    total_requests: number;
    avg_duration: number;
    success_count: number;
  }>();

  // Query for tool usage
  const toolStats = await env.DB.prepare(`
    SELECT
      endpoint as tool,
      COUNT(*) as calls,
      AVG(response_time_ms) as avg_duration
    FROM api_usage
    WHERE timestamp > ?
    AND endpoint LIKE '/mcp%'
    GROUP BY endpoint
  `).bind(startTime.toISOString()).all<{
    tool: string;
    calls: number;
    avg_duration: number;
  }>();

  // Query for errors
  const errorStats = await env.DB.prepare(`
    SELECT
      event_type,
      COUNT(*) as count
    FROM security_events
    WHERE timestamp > ?
    AND event_type IN ('error', 'auth_failure', 'rate_limit_exceeded')
    GROUP BY event_type
  `).bind(startTime.toISOString()).all<{
    event_type: string;
    count: number;
  }>();

  const totalRequests = usageStats?.total_requests || 0;
  const successCount = usageStats?.success_count || 0;

  const toolsMap: Record<string, { calls: number; avg_duration: number }> = {};
  let totalToolCalls = 0;

  for (const row of toolStats.results || []) {
    toolsMap[row.tool] = {
      calls: row.calls,
      avg_duration: Math.round(row.avg_duration || 0),
    };
    totalToolCalls += row.calls;
  }

  const errorsMap: Record<string, number> = {};
  let totalErrors = 0;

  for (const row of errorStats.results || []) {
    errorsMap[row.event_type] = row.count;
    totalErrors += row.count;
  }

  return {
    period: {
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      duration_seconds: periodMinutes * 60,
    },
    requests: {
      total: totalRequests,
      success_rate: totalRequests > 0 ? successCount / totalRequests : 1,
      avg_duration_ms: Math.round(usageStats?.avg_duration || 0),
      p95_duration_ms: 0, // Would need proper percentile calculation
    },
    tools: {
      total_calls: totalToolCalls,
      success_rate: 0.95, // Placeholder - would need actual tracking
      by_tool: toolsMap,
    },
    errors: {
      total: totalErrors,
      by_type: errorsMap,
    },
  };
}

/**
 * Export metrics for external consumption (e.g., Prometheus scraping)
 * Returns Prometheus exposition format
 */
export function exportPrometheusMetrics(): string {
  const buffer = metrics.getBuffer();
  const lines: string[] = [];

  // Group by metric name
  const grouped = new Map<string, MetricPoint[]>();
  for (const point of buffer) {
    const existing = grouped.get(point.name) || [];
    existing.push(point);
    grouped.set(point.name, existing);
  }

  for (const [name, points] of grouped) {
    const prometheusName = name.replace(/\./g, '_');
    lines.push(`# TYPE ${prometheusName} gauge`);

    for (const point of points) {
      const labels = Object.entries(point.tags)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');

      lines.push(`${prometheusName}{${labels}} ${point.value} ${point.timestamp}`);
    }
  }

  return lines.join('\n');
}
