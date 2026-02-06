/**
 * Rate Conversation API Endpoint
 *
 * POST /api/support/conversations/[id]/rate - Submit satisfaction rating
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

    // Parse request
    const body = await request.json() as { rating: number; feedback?: string };

    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return new Response(JSON.stringify({ error: 'Rating must be between 1 and 5' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update conversation with rating
    await db.updateConversation(conversationId, {
      satisfaction_rating: body.rating,
      satisfaction_feedback: body.feedback || null,
    });

    // Learn from the rating if AI was involved
    if (conversation.matched_pattern_id) {
      const ai = new SupportAI(db);
      await ai.learnFromResolution(conversation, body.rating >= 4);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Rating submitted',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Rate conversation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
