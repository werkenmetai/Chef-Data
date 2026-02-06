/**
 * Support Conversation Detail API Endpoint
 *
 * GET /api/support/conversations/[id] - Get conversation with messages
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../../lib/database';

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

    // Validate session
    const sessionId = cookies.get('session_id')?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = await db.validateSession(sessionId);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
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

    // Get conversation
    const data = await db.getConversationWithMessages(conversationId);

    if (!data) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check ownership
    if (data.conversation.user_id !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mark messages as read
    await db.markMessagesRead(conversationId, session.user.id);

    return new Response(JSON.stringify({
      conversation: data.conversation,
      messages: data.messages,
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
