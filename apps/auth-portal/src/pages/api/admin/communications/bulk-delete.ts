/**
 * Admin Bulk Communication Delete API
 *
 * POST /api/admin/communications/bulk-delete
 * Body: { ids: string[] }
 */

import type { APIRoute } from 'astro';
import type { D1Database } from '@cloudflare/workers-types';
import { Database } from '../../../../lib/database';

interface Env {
  DB: D1Database;
  TOKEN_ENCRYPTION_KEY?: string;
  ADMIN_EMAILS?: string;
}

async function isAdmin(
  db: Database,
  sessionId: string | undefined,
  adminEmails: string
): Promise<boolean> {
  if (!sessionId) return false;

  const session = await db.validateSession(sessionId);
  if (!session) return false;

  const adminList = adminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  return adminList.includes(session.user.email.toLowerCase());
}

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const env = locals.runtime?.env as Env | undefined;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);
  const sessionId = cookies.get('session_id')?.value;
  const isAdminUser = await isAdmin(db, sessionId, env.ADMIN_EMAILS || '');

  if (!isAdminUser) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { ids?: string[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { ids } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return new Response(JSON.stringify({ error: 'No IDs provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Limit bulk delete to 100 at a time
  if (ids.length > 100) {
    return new Response(JSON.stringify({ error: 'Max 100 items at a time' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Delete in batches using placeholders
    const placeholders = ids.map(() => '?').join(',');
    const result = await env.DB.prepare(
      `DELETE FROM communication_events WHERE id IN (${placeholders})`
    ).bind(...ids).run();

    console.log(`[Admin] Bulk deleted ${result.meta.changes} communication events`);

    return new Response(
      JSON.stringify({
        success: true,
        deleted: result.meta.changes,
        requested: ids.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Admin] Error bulk deleting communications:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete communications' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
