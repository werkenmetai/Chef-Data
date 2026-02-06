/**
 * Admin Signature API
 *
 * GET /api/admin/signature - Get current admin's signature
 * POST /api/admin/signature - Update current admin's signature
 */

import type { APIRoute } from 'astro';
import type { D1Database } from '@cloudflare/workers-types';
import { Database } from '../../../lib/database';

interface Env {
  DB: D1Database;
  TOKEN_ENCRYPTION_KEY?: string;
  ADMIN_EMAILS?: string;
}

async function getAdminSession(
  db: Database,
  sessionId: string | undefined,
  adminEmails: string
): Promise<{ userId: string; email: string; name: string | null } | null> {
  if (!sessionId) return null;

  const session = await db.validateSession(sessionId);
  if (!session) return null;

  const adminList = adminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  if (!adminList.includes(session.user.email.toLowerCase())) {
    return null;
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}

export const GET: APIRoute = async ({ cookies, locals }) => {
  const env = locals.runtime?.env as Env | undefined;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);
  const sessionId = cookies.get('session_id')?.value;
  const admin = await getAdminSession(db, sessionId, env.ADMIN_EMAILS || '');

  if (!admin) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await env.DB.prepare(
      'SELECT email_signature FROM users WHERE id = ?'
    ).bind(admin.userId).first<{ email_signature: string | null }>();

    // Default signature if none set
    const defaultSignature = `Met vriendelijke groet,\n${admin.name || admin.email.split('@')[0]}\nPraat met je Boekhouding Support`;

    return new Response(
      JSON.stringify({
        signature: result?.email_signature || defaultSignature,
        isDefault: !result?.email_signature,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Admin] Error getting signature:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get signature' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

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
  const admin = await getAdminSession(db, sessionId, env.ADMIN_EMAILS || '');

  if (!admin) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { signature?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { signature } = body;

  if (typeof signature !== 'string') {
    return new Response(JSON.stringify({ error: 'Signature must be a string' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Limit signature length
  if (signature.length > 1000) {
    return new Response(JSON.stringify({ error: 'Signature too long (max 1000 chars)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await env.DB.prepare(
      'UPDATE users SET email_signature = ? WHERE id = ?'
    ).bind(signature || null, admin.userId).run();

    console.log(`[Admin] Updated signature for ${admin.email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Admin] Error updating signature:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update signature' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
