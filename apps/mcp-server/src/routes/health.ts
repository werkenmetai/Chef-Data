/**
 * Health Check Endpoints
 *
 * Provides multiple health check endpoints for different monitoring needs:
 * - /health - Basic health (public, for uptime monitors)
 * - /health/deep - Detailed health with component checks (internal)
 * - /health/synthetic - End-to-end flow test (for synthetic monitoring)
 */

import { Env } from '../types';
import { Logger, generateRequestId } from '../lib/logger';
import { getHealthCorsHeaders } from '../lib/cors';

/**
 * Component health status
 */
interface ComponentHealth {
  status: 'ok' | 'degraded' | 'error';
  latency_ms?: number;
  message?: string;
}

/**
 * Basic health response
 */
interface BasicHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  timestamp: string;
  latency: {
    total_ms: number;
  };
}

/**
 * Detailed health response
 */
interface DeepHealthResponse extends BasicHealthResponse {
  checks: {
    database: ComponentHealth;
    exact_api?: ComponentHealth;
    tools_registry: ComponentHealth;
  };
  latency: {
    total_ms: number;
    database_ms?: number;
    exact_api_ms?: number;
  };
  system: {
    colo?: string;
    request_id: string;
  };
}

/**
 * Synthetic test response
 */
interface SyntheticHealthResponse {
  status: 'pass' | 'fail';
  timestamp: string;
  checks: {
    tools_list: boolean;
    database_read: boolean;
    database_write: boolean;
  };
  duration_ms: number;
}

const VERSION = '0.2.0';

// SEC-002: CORS headers are now obtained via getHealthCorsHeaders() from lib/cors.ts

/**
 * Basic health check - for uptime monitors
 * GET /health
 */
export async function handleBasicHealth(
  env: Env,
  request?: Request
): Promise<Response> {
  const start = Date.now();
  const logger = new Logger('mcp-server', {
    requestId: request ? generateRequestId() : undefined,
    endpoint: '/health',
  });

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Quick database check
  try {
    await env.DB.prepare('SELECT 1').first();
  } catch (error) {
    status = 'unhealthy';
    logger.error('Health check failed: database unreachable', error instanceof Error ? error : undefined);
  }

  const response: BasicHealthResponse = {
    status,
    version: VERSION,
    environment: env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString(),
    latency: {
      total_ms: Date.now() - start,
    },
  };

  return new Response(JSON.stringify(response), {
    status: status === 'healthy' ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      ...getHealthCorsHeaders(request, env),
    },
  });
}

/**
 * Deep health check - for detailed monitoring
 * GET /health/deep
 *
 * Note: Consider adding auth for production to prevent info disclosure
 */
export async function handleDeepHealth(
  env: Env,
  request: Request
): Promise<Response> {
  const start = Date.now();
  const requestId = generateRequestId();
  const logger = new Logger('mcp-server', {
    requestId,
    endpoint: '/health/deep',
    environment: env.ENVIRONMENT,
  });

  const checks: DeepHealthResponse['checks'] = {
    database: { status: 'ok' },
    tools_registry: { status: 'ok' },
  };

  const latency: DeepHealthResponse['latency'] = {
    total_ms: 0,
  };

  // 1. Database check with timing
  const dbStart = Date.now();
  try {
    const result = await env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users) as user_count,
        (SELECT COUNT(*) FROM connections WHERE status = 'active') as connection_count
    `).first<{ user_count: number; connection_count: number }>();

    latency.database_ms = Date.now() - dbStart;

    if (result) {
      checks.database = {
        status: 'ok',
        latency_ms: latency.database_ms,
      };
    } else {
      checks.database = {
        status: 'degraded',
        latency_ms: latency.database_ms,
        message: 'Query returned no results',
      };
    }
  } catch (error) {
    latency.database_ms = Date.now() - dbStart;
    checks.database = {
      status: 'error',
      latency_ms: latency.database_ms,
      message: 'Database query failed',
    };
    logger.error('Database health check failed', error instanceof Error ? error : undefined);
  }

  // 2. Tools registry check
  try {
    // Lazy import to avoid circular dependencies
    const { ToolRegistry } = await import('../mcp/tools');
    const registry = new ToolRegistry();
    const tools = registry.listTools();

    if (tools.length > 0) {
      checks.tools_registry = {
        status: 'ok',
        message: `${tools.length} tools registered`,
      };
    } else {
      checks.tools_registry = {
        status: 'degraded',
        message: 'No tools registered',
      };
    }
  } catch (error) {
    checks.tools_registry = {
      status: 'error',
      message: 'Failed to load tool registry',
    };
    logger.error('Tools registry check failed', error instanceof Error ? error : undefined);
  }

  // 3. Exact Online API check (passive - don't actually call the API)
  // Only check if we have active connections and could potentially reach Exact
  try {
    const activeConnections = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM connections
      WHERE status = 'active'
      AND datetime(token_expires_at) > datetime('now')
    `).first<{ count: number }>();

    if (activeConnections && activeConnections.count > 0) {
      checks.exact_api = {
        status: 'ok',
        message: `${activeConnections.count} active connections`,
      };
    } else {
      checks.exact_api = {
        status: 'degraded',
        message: 'No active connections available',
      };
    }
  } catch {
    checks.exact_api = {
      status: 'error',
      message: 'Failed to check connections',
    };
  }

  // Determine overall status
  const hasError = Object.values(checks).some(c => c.status === 'error');
  const hasDegraded = Object.values(checks).some(c => c.status === 'degraded');

  latency.total_ms = Date.now() - start;

  // Get Cloudflare colo from request
  const colo = request.cf?.colo as string | undefined;

  const response: DeepHealthResponse = {
    status: hasError ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy',
    version: VERSION,
    environment: env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString(),
    checks,
    latency,
    system: {
      colo,
      request_id: requestId,
    },
  };

  logger.info('Deep health check completed', {
    status: response.status,
    latency: latency.total_ms,
  });

  return new Response(JSON.stringify(response, null, 2), {
    status: response.status === 'healthy' ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
      ...getHealthCorsHeaders(request, env),
    },
  });
}

/**
 * Synthetic health check - for end-to-end monitoring
 * GET /health/synthetic
 *
 * Tests actual functionality without making external API calls.
 * Useful for synthetic monitoring services like Checkly or Better Uptime.
 */
export async function handleSyntheticHealth(env: Env, request?: Request): Promise<Response> {
  const start = Date.now();

  const checks = {
    tools_list: false,
    database_read: false,
    database_write: false,
  };

  // 1. Test tools registry
  try {
    const { ToolRegistry } = await import('../mcp/tools');
    const registry = new ToolRegistry();
    checks.tools_list = registry.listTools().length > 0;
  } catch {
    // Keep false
  }

  // 2. Test database read
  try {
    const result = await env.DB.prepare('SELECT 1 as test').first<{ test: number }>();
    checks.database_read = result?.test === 1;
  } catch {
    // Keep false
  }

  // 3. Test database write (to a dedicated test table or use existing)
  try {
    // Use security_events table for write test (it's append-only anyway)
    const testId = `health_check_${Date.now()}`;
    await env.DB.prepare(`
      INSERT INTO security_events (event_type, details, timestamp)
      VALUES ('health_check', ?, datetime('now'))
    `).bind(JSON.stringify({ test_id: testId })).run();

    // Clean up old health check events (keep last 10)
    await env.DB.prepare(`
      DELETE FROM security_events
      WHERE event_type = 'health_check'
      AND id NOT IN (
        SELECT id FROM security_events
        WHERE event_type = 'health_check'
        ORDER BY timestamp DESC LIMIT 10
      )
    `).run();

    checks.database_write = true;
  } catch {
    // Write test failed, but that's okay for read-only scenarios
    checks.database_write = false;
  }

  const allPassed = Object.values(checks).every(v => v);
  const durationMs = Date.now() - start;

  const response: SyntheticHealthResponse = {
    status: allPassed ? 'pass' : 'fail',
    timestamp: new Date().toISOString(),
    checks,
    duration_ms: durationMs,
  };

  return new Response(JSON.stringify(response), {
    status: allPassed ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      ...getHealthCorsHeaders(request, env),
    },
  });
}

/**
 * Exact Online API status probe
 * Internal function - not exposed as endpoint
 *
 * Checks if Exact Online API is reachable by making a lightweight request.
 */
export async function probeExactOnlineStatus(): Promise<ComponentHealth> {
  try {
    const start = Date.now();

    // Use a lightweight endpoint - /api/oauth2/token with invalid request
    // Will return 400 but confirms the API is responding
    const response = await fetch('https://start.exactonline.nl/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=health_check', // Invalid, but gets a response
    });

    const latencyMs = Date.now() - start;

    // 400 means API is up and responding (it rejected our invalid request)
    // 200 would also be fine
    // 5xx or network error means problems
    if (response.status < 500) {
      return {
        status: latencyMs > 2000 ? 'degraded' : 'ok',
        latency_ms: latencyMs,
        message: latencyMs > 2000 ? 'High latency' : undefined,
      };
    }

    return {
      status: 'error',
      latency_ms: latencyMs,
      message: `Exact API returned ${response.status}`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Exact Online API unreachable',
    };
  }
}

/**
 * Handle health check routing
 */
export function handleHealthRoutes(
  request: Request,
  url: URL,
  env: Env
): Promise<Response> | null {
  // Basic health
  if (url.pathname === '/health' && request.method === 'GET') {
    return handleBasicHealth(env, request);
  }

  // Deep health
  if (url.pathname === '/health/deep' && request.method === 'GET') {
    return handleDeepHealth(env, request);
  }

  // Synthetic health
  if (url.pathname === '/health/synthetic' && request.method === 'GET') {
    return handleSyntheticHealth(env, request);
  }

  // Not a health route
  return null;
}
