/**
 * Cron Trigger Handler
 * Routes: /api/cron/hourly, /api/cron/daily, /api/cron/monthly
 *
 * Beveiligd via CRON_SECRET header of Cloudflare Cron Trigger
 */

import type { APIRoute } from 'astro';
import { handleCron } from '../../../lib/automation';

export const GET: APIRoute = async ({ params, request, locals }) => {
  const trigger = params.trigger as 'hourly' | 'daily' | 'monthly';

  // Validate trigger
  if (!['hourly', 'daily', 'monthly'].includes(trigger)) {
    return new Response(JSON.stringify({ error: 'Invalid trigger' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // SEC-003: Security - CRON_SECRET is required as primary security mechanism
  // Note: CF-Connecting-IP header can be spoofed, so we don't rely on it
  const cronSecret = (locals as any).runtime?.env?.CRON_SECRET;
  const providedSecret = request.headers.get('X-Cron-Secret');

  // Always require CRON_SECRET to be configured and provided
  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET not configured - rejecting request');
    return new Response(JSON.stringify({ error: 'Cron not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (providedSecret !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const env = (locals as any).runtime?.env;

    if (!env?.DB) {
      throw new Error('Database not available');
    }

    const result = await handleCron(env, trigger);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[CRON ERROR]', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Also support POST for manual triggers
export const POST = GET;
