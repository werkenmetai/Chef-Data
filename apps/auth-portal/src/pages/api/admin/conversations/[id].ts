/**
 * Admin Conversation Management API
 *
 * DELETE /api/admin/conversations/[id] - Delete conversation and all messages
 * PATCH /api/admin/conversations/[id] - Update conversation (archive, spam, status)
 *
 * Requires admin authentication.
 */

import type { APIRoute } from 'astro';
import type { D1Database } from '@cloudflare/workers-types';
import { Database } from '../../../../lib/database';

interface Env {
  DB: D1Database;
  TOKEN_ENCRYPTION_KEY?: string;
  ADMIN_EMAILS?: string;
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
 * DELETE - Delete conversation and all messages
 */
export const DELETE: APIRoute = async ({ params, cookies, locals }) => {
  const env = locals.runtime?.env as Env | undefined;
  const conversationId = params.id;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!conversationId) {
    return new Response(JSON.stringify({ error: 'Conversation ID required' }), {
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
    // Delete all messages in the conversation first (foreign key constraint)
    await env.DB.prepare('DELETE FROM support_messages WHERE conversation_id = ?')
      .bind(conversationId)
      .run();

    // Delete the conversation
    const result = await env.DB.prepare('DELETE FROM support_conversations WHERE id = ?')
      .bind(conversationId)
      .run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Also delete related communication events
    await env.DB.prepare('DELETE FROM communication_events WHERE related_id = ?')
      .bind(conversationId)
      .run();

    console.log(`[Admin] Deleted conversation: ${conversationId}`);

    return new Response(JSON.stringify({ success: true, deleted: conversationId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Admin] Error deleting conversation:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete conversation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * PATCH - Update conversation (status, archive, spam)
 */
export const PATCH: APIRoute = async ({ params, request, cookies, locals }) => {
  const env = locals.runtime?.env as Env | undefined;
  const conversationId = params.id;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!conversationId) {
    return new Response(JSON.stringify({ error: 'Conversation ID required' }), {
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

  let body: { status?: string; is_spam?: boolean; is_archived?: boolean };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const updates: string[] = [];
    const values: (string | number)[] = [];

    // Handle status update
    if (body.status) {
      const validStatuses = ['open', 'waiting_user', 'waiting_support', 'resolved', 'closed', 'spam', 'archived'];
      if (!validStatuses.includes(body.status)) {
        return new Response(
          JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      updates.push('status = ?');
      values.push(body.status);
    }

    // Handle spam flag (sets status to 'spam' or 'open')
    if (typeof body.is_spam === 'boolean') {
      updates.push('status = ?');
      values.push(body.is_spam ? 'spam' : 'open');
    }

    // Handle archive flag (sets status to 'archived' or 'closed')
    if (typeof body.is_archived === 'boolean') {
      updates.push('status = ?');
      values.push(body.is_archived ? 'archived' : 'closed');
    }

    if (updates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid fields to update' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add updated_at
    updates.push("updated_at = datetime('now')");
    values.push(conversationId);

    const sql = `UPDATE support_conversations SET ${updates.join(', ')} WHERE id = ?`;
    const result = await env.DB.prepare(sql).bind(...values).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Admin] Updated conversation ${conversationId}:`, body);

    return new Response(
      JSON.stringify({ success: true, updated: conversationId, changes: body }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Admin] Error updating conversation:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update conversation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * GET - Get conversation details (for admin)
 */
export const GET: APIRoute = async ({ params, cookies, locals }) => {
  const env = locals.runtime?.env as Env | undefined;
  const conversationId = params.id;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!conversationId) {
    return new Response(JSON.stringify({ error: 'Conversation ID required' }), {
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
    // Get conversation with user info
    const conversation = await env.DB.prepare(`
      SELECT
        c.*,
        u.email as user_email,
        u.name as user_name
      FROM support_conversations c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).bind(conversationId).first();

    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all messages
    const messages = await env.DB.prepare(`
      SELECT * FROM support_messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).bind(conversationId).all();

    return new Response(
      JSON.stringify({
        conversation,
        messages: messages.results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Admin] Error getting conversation:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get conversation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
