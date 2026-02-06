/**
 * Outreach Logs API
 *
 * GET /api/admin/outreach/logs - Get recent outreach logs
 * GET /api/admin/outreach/logs?campaign_id=xxx - Get logs for specific campaign
 *
 * @author Sophie (Customer Success)
 */

import type { APIRoute } from 'astro';
import type { D1Database } from '@cloudflare/workers-types';
import { Database } from '../../../../lib/database';
import { createOutreachEngine } from '../../../../lib/outreach';

// Helper to check admin access
async function isAdmin(request: Request, env: { DB: D1Database; TOKEN_ENCRYPTION_KEY?: string; ADMIN_EMAILS?: string }, cookies: { get: (name: string) => { value: string } | undefined }): Promise<boolean> {
  const adminEmails = (env.ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter((e: string) => e.length > 0);

  if (adminEmails.length === 0) return false;

  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) return false;

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);
  const session = await db.validateSession(sessionId);

  if (!session) return false;

  return adminEmails.includes(session.user.email.toLowerCase());
}

export const GET: APIRoute = async ({ request, locals, cookies, url }) => {
  const env = locals.runtime?.env;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check admin access
  if (!(await isAdmin(request, env, cookies))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const campaignId = url.searchParams.get('campaign_id');
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 500) : 50;

    const engine = createOutreachEngine(env.DB, env);

    const logs = campaignId
      ? await engine.getCampaignLogs(campaignId, limit)
      : await engine.getRecentLogs(limit);

    return new Response(
      JSON.stringify({ logs }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
