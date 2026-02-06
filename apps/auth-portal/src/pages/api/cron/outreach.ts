/**
 * Outreach Cron Endpoint
 *
 * POST /api/cron/outreach
 *
 * Runs all active outreach campaigns and sends emails where appropriate.
 * Should be called by Cloudflare Cron Trigger daily.
 *
 * Security:
 * - Requires CRON_SECRET header for authentication
 * - Rate limited by Cloudflare WAF
 *
 * @author Sophie (Customer Success)
 */

import type { APIRoute } from 'astro';
import { createOutreachEngine } from '../../../lib/outreach';

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime?.env;

  // Verify cron secret (protect from unauthorized calls)
  const cronSecret = request.headers.get('X-Cron-Secret') || request.headers.get('Authorization')?.replace('Bearer ', '');

  // Allow if:
  // 1. CRON_SECRET is set and matches, OR
  // 2. Request is from Cloudflare (via cf-connecting-ip header and internal subnet), OR
  // 3. In development mode (no CRON_SECRET set)
  const isAuthorized =
    (env.CRON_SECRET && cronSecret === env.CRON_SECRET) ||
    (!env.CRON_SECRET && process.env.NODE_ENV !== 'production');

  if (!isAuthorized) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (!env.DB) {
    return new Response(
      JSON.stringify({ error: 'Database not available' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const engine = createOutreachEngine(env.DB, env);
    const startTime = Date.now();

    // Run all active campaigns
    const results = await engine.runAllCampaigns();

    const duration = Date.now() - startTime;

    // Log summary
    console.log('[OUTREACH CRON]', {
      processed: results.processed,
      sent: results.sent,
      errors: results.errors,
      duration: `${duration}ms`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          processed: results.processed,
          sent: results.sent,
          errors: results.errors,
          duration_ms: duration,
        },
        results: results.results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[OUTREACH CRON ERROR]', error);

    return new Response(
      JSON.stringify({
        error: 'Outreach processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * GET endpoint for manual testing/status check
 */
export const GET: APIRoute = async ({ locals }) => {
  const env = locals.runtime?.env;

  if (!env.DB) {
    return new Response(
      JSON.stringify({ error: 'Database not available' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const engine = createOutreachEngine(env.DB, env);
    const stats = await engine.getStats();

    return new Response(
      JSON.stringify({
        status: 'ready',
        stats,
        lastCheck: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
