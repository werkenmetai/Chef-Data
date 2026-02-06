/**
 * Admin User Email Aliases API
 *
 * GET /api/admin/users/[id]/emails - List all email aliases for user
 * POST /api/admin/users/[id]/emails - Add email alias
 * DELETE /api/admin/users/[id]/emails?email=xxx - Remove email alias
 *
 * Requires admin authentication.
 */

import type { APIRoute } from 'astro';
import type { D1Database } from '@cloudflare/workers-types';
import { Database } from '../../../../../lib/database';

interface Env {
  DB: D1Database;
  TOKEN_ENCRYPTION_KEY?: string;
  ADMIN_EMAILS?: string;
}

// Generate secure random ID
function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Check if user is admin
 */
async function isAdmin(
  db: Database,
  sessionId: string | undefined,
  adminEmails: string
): Promise<{ isAdmin: boolean; email?: string }> {
  if (!sessionId) return { isAdmin: false };

  const session = await db.validateSession(sessionId);
  if (!session) return { isAdmin: false };

  const adminList = adminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  const isAdminUser = adminList.includes(session.user.email.toLowerCase());
  return { isAdmin: isAdminUser, email: session.user.email };
}

/**
 * GET - List all email aliases for a user
 */
export const GET: APIRoute = async ({ params, cookies, locals }) => {
  const env = locals.runtime?.env as Env | undefined;
  const userId = params.id;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: 'User ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);
  const sessionId = cookies.get('session_id')?.value;
  const { isAdmin: isAdminUser } = await isAdmin(db, sessionId, env.ADMIN_EMAILS || '');

  if (!isAdminUser) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get user's primary email
    const user = await env.DB.prepare('SELECT id, email, name FROM users WHERE id = ?')
      .bind(userId)
      .first<{ id: string; email: string; name: string | null }>();

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all aliases
    const aliases = await env.DB.prepare(`
      SELECT id, email, verified, created_at, created_by
      FROM user_email_aliases
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(userId).all();

    return new Response(
      JSON.stringify({
        user_id: userId,
        primary_email: user.email,
        aliases: aliases.results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Admin] Error getting email aliases:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get email aliases' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * POST - Add email alias to user
 */
export const POST: APIRoute = async ({ params, request, cookies, locals }) => {
  const env = locals.runtime?.env as Env | undefined;
  const userId = params.id;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: 'User ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);
  const sessionId = cookies.get('session_id')?.value;
  const { isAdmin: isAdminUser, email: adminEmail } = await isAdmin(db, sessionId, env.ADMIN_EMAILS || '');

  if (!isAdminUser) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { email } = body;

  if (!email || typeof email !== 'string') {
    return new Response(JSON.stringify({ error: 'Email is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if user exists
    const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?')
      .bind(userId)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if email is already a primary email for any user
    const existingUser = await env.DB.prepare('SELECT id FROM users WHERE LOWER(email) = ?')
      .bind(normalizedEmail)
      .first();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Email is already a primary email for another user' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if email is already an alias
    const existingAlias = await env.DB.prepare('SELECT user_id FROM user_email_aliases WHERE LOWER(email) = ?')
      .bind(normalizedEmail)
      .first<{ user_id: string }>();

    if (existingAlias) {
      if (existingAlias.user_id === userId) {
        return new Response(
          JSON.stringify({ error: 'Email is already an alias for this user' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Email is already an alias for another user' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add the alias
    const aliasId = generateId();
    await env.DB.prepare(`
      INSERT INTO user_email_aliases (id, user_id, email, verified, created_at, created_by)
      VALUES (?, ?, ?, TRUE, datetime('now'), ?)
    `).bind(aliasId, userId, normalizedEmail, adminEmail || null).run();

    console.log(`[Admin] Added email alias ${normalizedEmail} to user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        alias: {
          id: aliasId,
          email: normalizedEmail,
          verified: true,
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Admin] Error adding email alias:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to add email alias' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * DELETE - Remove email alias from user
 */
export const DELETE: APIRoute = async ({ params, url, cookies, locals }) => {
  const env = locals.runtime?.env as Env | undefined;
  const userId = params.id;
  const emailToDelete = url.searchParams.get('email');

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: 'User ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!emailToDelete) {
    return new Response(JSON.stringify({ error: 'Email query parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);
  const sessionId = cookies.get('session_id')?.value;
  const { isAdmin: isAdminUser } = await isAdmin(db, sessionId, env.ADMIN_EMAILS || '');

  if (!isAdminUser) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await env.DB.prepare(`
      DELETE FROM user_email_aliases
      WHERE user_id = ? AND LOWER(email) = ?
    `).bind(userId, emailToDelete.toLowerCase()).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: 'Alias not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Admin] Removed email alias ${emailToDelete} from user ${userId}`);

    return new Response(
      JSON.stringify({ success: true, deleted: emailToDelete }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Admin] Error removing email alias:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to remove email alias' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
