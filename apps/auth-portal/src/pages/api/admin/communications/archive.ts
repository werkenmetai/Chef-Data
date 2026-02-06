/**
 * Admin Communication Archive API
 *
 * POST /api/admin/communications/archive
 * Body: { ids: string[], archived: boolean }
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

  let body: { ids?: string[]; archived?: boolean };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { ids, archived = true } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return new Response(JSON.stringify({ error: 'No IDs provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Limit bulk archive to 100 at a time
  if (ids.length > 100) {
    return new Response(JSON.stringify({ error: 'Max 100 items at a time' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const placeholders = ids.map(() => '?').join(',');
    const result = await env.DB.prepare(
      `UPDATE communication_events SET archived = ? WHERE id IN (${placeholders})`
    ).bind(archived ? 1 : 0, ...ids).run();

    const action = archived ? 'archived' : 'unarchived';
    console.log(`[Admin] ${action} ${result.meta.changes} communication events`);

    return new Response(
      JSON.stringify({
        success: true,
        updated: result.meta.changes,
        requested: ids.length,
        archived,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Admin] Error archiving communications:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to archive communications' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
