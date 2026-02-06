/**
 * Provider Stats API Endpoint
 *
 * Returns AI provider usage statistics for the authenticated user.
 * GET /api/stats/providers
 *
 * Response:
 * {
 *   providers: [{ provider: 'claude', displayName: 'Claude', count: 45, lastUsed: '...' }],
 *   lastProvider: 'claude'
 * }
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../lib/database';

export const GET: APIRoute = async ({ cookies, locals }) => {
  try {
    const env = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;
    if (!env?.DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new Database(env.DB as D1Database, env.TOKEN_ENCRYPTION_KEY as string | undefined);

    // Check for session
    const sessionId = cookies.get('session_id')?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate session
    const sessionResult = await db.validateSession(sessionId);
    if (!sessionResult) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get provider stats for this user
    const stats = await db.getProviderStats(sessionResult.user.id, 30);

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Provider stats error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
