/**
 * Resolve Conversation API Endpoint
 *
 * POST /api/support/conversations/[id]/resolve - Mark conversation as resolved
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../../../lib/database';
import { SupportAI } from '../../../../../lib/support-ai';

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
    const conversation = await db.getConversation(conversationId);
    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check ownership
    if (conversation.user_id !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if already resolved
    if (conversation.status === 'resolved' || conversation.status === 'closed') {
      return new Response(JSON.stringify({ error: 'Conversation already resolved' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request for optional notes
    let notes: string | null = null;
    try {
      const body = await request.json() as { notes?: string };
      notes = body.notes || null;
    } catch {
      // No body is fine
    }

    // Determine resolution type
    const resolutionType = conversation.handled_by === 'ai' ? 'auto_resolved' : 'user_resolved';

    // Update conversation
    await db.updateConversation(conversationId, {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolution_type: resolutionType,
      resolution_notes: notes,
    });

    // Add system message
    await db.addMessage(conversationId, {
      sender_type: 'system',
      content: 'Dit gesprek is gemarkeerd als opgelost.',
    });

    // Track pattern usage if AI resolved
    if (conversation.matched_pattern_id) {
      const ai = new SupportAI(db);
      await ai.learnFromResolution(conversation, true);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Conversation resolved',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Resolve conversation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
