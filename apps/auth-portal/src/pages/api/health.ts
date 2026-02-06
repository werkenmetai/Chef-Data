/**
 * Health Check Endpoint
 * GET /api/health
 *
 * Used by uptime monitoring services (Pingdom, UptimeRobot, etc.)
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const startTime = Date.now();
  const checks: Record<string, { status: string; latency?: number }> = {};

  // Check database
  try {
    const env = (locals as any).runtime?.env;
    if (env?.DB) {
      const dbStart = Date.now();
      await env.DB.prepare('SELECT 1').first();
      checks.database = {
        status: 'ok',
        latency: Date.now() - dbStart,
      };
    } else {
      checks.database = { status: 'unavailable' };
    }
  } catch (error) {
    checks.database = { status: 'error' };
  }

  // Check MCP server
  try {
    const mcpStart = Date.now();
    const response = await fetch('https://api.praatmetjeboekhouding.nl/health', {
      signal: AbortSignal.timeout(5000),
    });
    checks.mcp_server = {
      status: response.ok ? 'ok' : 'degraded',
      latency: Date.now() - mcpStart,
    };
  } catch {
    checks.mcp_server = { status: 'unreachable' };
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok');

  return new Response(
    JSON.stringify({
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      latency: Date.now() - startTime,
      checks,
    }),
    {
      status: allOk ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
};
