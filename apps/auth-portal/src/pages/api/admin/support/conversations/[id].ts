/**
 * Admin Conversation Detail API Endpoint
 *
 * GET /api/admin/support/conversations/[id] - Get conversation with all messages
 * PUT /api/admin/support/conversations/[id] - Update conversation (assign, close, etc.)
 * POST /api/admin/support/conversations/[id] - Add admin response
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../../../lib/database';

// Helper to check admin
async function isAdmin(db: Database, env: Record<string, unknown>, cookies: { get: (name: string) => { value?: string } | undefined }): Promise<{ isAdmin: boolean; userId?: string; email?: string }> {
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) return { isAdmin: false };

  const session = await db.validateSession(sessionId);
  if (!session) return { isAdmin: false };

  const adminEmails = ((env.ADMIN_EMAILS as string) || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);

  const userEmail = session.user.email.toLowerCase();
  return {
    isAdmin: adminEmails.length > 0 && adminEmails.includes(userEmail),
    userId: session.user.id,
    email: session.user.email,
  };
}

export const GET: APIRoute = async ({ cookies, locals, params }) => {
  try {
    const env = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;
    if (!env?.DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new Database(env.DB as D1Database, env.TOKEN_ENCRYPTION_KEY as string | undefined);
    const admin = await isAdmin(db, env, cookies);

    if (!admin.isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const conversationId = params.id;
    if (!conversationId) {
      return new Response(JSON.stringify({ error: 'Conversation ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await db.getConversationWithMessages(conversationId);
    if (!data) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all messages including internal
    const allMessages = await db.getMessages(conversationId, true);

    // Get user info
    const user = await db.findUserById(data.conversation.user_id);

    return new Response(JSON.stringify({
      conversation: data.conversation,
      messages: allMessages,
      user: user ? { id: user.id, email: user.email, name: user.name, plan: user.plan } : null,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ cookies, locals, params, request }) => {
  try {
    const env = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;
    if (!env?.DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new Database(env.DB as D1Database, env.TOKEN_ENCRYPTION_KEY as string | undefined);
    const admin = await isAdmin(db, env, cookies);

    if (!admin.isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const conversationId = params.id;
    if (!conversationId) {
      return new Response(JSON.stringify({ error: 'Conversation ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const conversation = await db.getConversation(conversationId);
    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as {
      action?: 'assign' | 'close' | 'reopen';
      assigned_to?: string;
      status?: string;
      priority?: string;
      resolution_notes?: string;
    };

    const updates: Record<string, unknown> = {};

    if (body.action === 'assign') {
      updates.assigned_to = body.assigned_to || admin.userId;
      updates.handled_by = conversation.handled_by === 'ai' ? 'hybrid' : 'human';
    }

    if (body.action === 'close') {
      updates.status = 'closed';
      updates.resolved_at = new Date().toISOString();
      updates.resolution_type = 'admin_resolved';
      updates.resolution_notes = body.resolution_notes || null;
    }

    if (body.action === 'reopen') {
      updates.status = 'open';
      updates.resolved_at = null;
      updates.resolution_type = null;
    }

    if (body.status) {
      updates.status = body.status;
    }

    if (body.priority) {
      updates.priority = body.priority;
    }

    await db.updateConversation(conversationId, updates);

    const updatedConversation = await db.getConversation(conversationId);

    return new Response(JSON.stringify({
      conversation: updatedConversation,
      success: true,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update conversation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ cookies, locals, params, request }) => {
  try {
    const env = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;
    if (!env?.DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new Database(env.DB as D1Database, env.TOKEN_ENCRYPTION_KEY as string | undefined);
    const admin = await isAdmin(db, env, cookies);

    if (!admin.isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const conversationId = params.id;
    if (!conversationId) {
      return new Response(JSON.stringify({ error: 'Conversation ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const conversation = await db.getConversation(conversationId);
    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as {
      content: string;
      is_internal?: boolean;
    };

    if (!body.content || body.content.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message content required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add admin message
    const message = await db.addMessage(conversationId, {
      sender_type: 'admin',
      sender_id: admin.userId,
      content: body.content.trim(),
      is_internal: body.is_internal || false,
    });

    // Update conversation
    const updates: Record<string, unknown> = {
      status: body.is_internal ? conversation.status : 'waiting_user',
      handled_by: conversation.handled_by === 'ai' ? 'hybrid' : 'human',
    };

    if (!conversation.first_response_at && !body.is_internal) {
      updates.first_response_at = new Date().toISOString();
    }

    if (!conversation.assigned_to) {
      updates.assigned_to = admin.userId;
    }

    await db.updateConversation(conversationId, updates);

    return new Response(JSON.stringify({
      message,
      success: true,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Add admin message error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
