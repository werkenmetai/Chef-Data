/**
 * Support Status API Endpoint
 *
 * GET /api/support/status
 * Returns whether support is available and any pause message
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../lib/database';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const env = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;
    if (!env?.DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new Database(env.DB as D1Database, env.TOKEN_ENCRYPTION_KEY as string | undefined);

    const settings = await db.getAllSystemSettings();

    const isEnabled = settings.support_enabled !== 'false';
    const isPaused = settings.support_paused === 'true';

    return new Response(JSON.stringify({
      available: isEnabled && !isPaused,
      enabled: isEnabled,
      paused: isPaused,
      pauseMessage: isPaused ? settings.support_pause_message : null,
      aiEnabled: settings.support_ai_enabled !== 'false',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Support status error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
