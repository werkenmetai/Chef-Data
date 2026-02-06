/**
 * Admin Communication Management API
 *
 * DELETE /api/admin/communications/[id] - Delete single communication event
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

export const DELETE: APIRoute = async ({ params, cookies, locals }) => {
  const env = locals.runtime?.env as Env | undefined;
  const commId = params.id;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!commId) {
    return new Response(JSON.stringify({ error: 'Communication ID required' }), {
      status: 400,
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

  try {
    const result = await env.DB.prepare('DELETE FROM communication_events WHERE id = ?')
      .bind(commId)
      .run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: 'Communication not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Admin] Deleted communication event: ${commId}`);

    return new Response(JSON.stringify({ success: true, deleted: commId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Admin] Error deleting communication:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete communication' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
