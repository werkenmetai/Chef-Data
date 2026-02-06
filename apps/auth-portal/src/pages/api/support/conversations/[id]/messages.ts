/**
 * Conversation Messages API Endpoint
 *
 * POST /api/support/conversations/[id]/messages - Add new message
 *
 * Flow:
 * 1. User sends message
 * 2. Check support settings (enabled/paused)
 * 3. Basic pattern matching via SupportAI for quick responses
 * 4. If no pattern match, trigger full Support Agent (Claude) async
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../../../lib/database';
import { SupportAI } from '../../../../../lib/support-ai';
import { getSiteUrl } from '../../../../../lib/security';

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

    // Check if conversation is still open
    if (conversation.status === 'closed' || conversation.status === 'resolved') {
      return new Response(JSON.stringify({ error: 'Conversation is closed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const body = await request.json() as { content: string };
    if (!body.content || body.content.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message content required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add user message
    const userMessage = await db.addMessage(conversationId, {
      sender_type: 'user',
      sender_id: session.user.id,
      content: body.content.trim(),
    });

    // Update conversation status
    await db.updateConversation(conversationId, {
      status: 'waiting_support',
    });

    // Check support settings
    const settings = await db.getAllSystemSettings();
    const supportEnabled = settings.support_enabled !== 'false';
    const supportPaused = settings.support_paused === 'true';
    const aiEnabled = settings.support_ai_enabled !== 'false';
    const confidenceThreshold = parseFloat(settings.support_ai_confidence_threshold || '0.8');

    let aiResponse = null;
    let agentTriggered = false;

    // If support is paused, add pause message
    if (supportPaused && settings.support_pause_message) {
      aiResponse = await db.addMessage(conversationId, {
        sender_type: 'system',
        content: settings.support_pause_message,
      });

      await db.updateConversation(conversationId, {
        status: 'waiting_support',
      });
    }
    // If support and AI are enabled, try to respond
    else if (supportEnabled && aiEnabled && conversation.handled_by !== 'human') {
      const ai = new SupportAI(db);
      const existingMessages = await db.getMessages(conversationId);

      const triage = await ai.analyzeMessage(body.content, {
        conversation,
        messages: existingMessages.map(m => ({ sender_type: m.sender_type, content: m.content })),
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          plan: session.user.plan,
          preferredLanguage: 'nl',
        },
      });

      // Update conversation with triage info
      await db.updateConversation(conversationId, {
        category: conversation.category || triage.category,
        priority: triage.priority,
      });

      // If we have a high-confidence pattern match, respond immediately
      if (triage.canAutoRespond && triage.confidence >= confidenceThreshold && triage.suggestedResponse) {
        aiResponse = await db.addMessage(conversationId, {
          sender_type: 'ai',
          content: triage.suggestedResponse,
          ai_confidence: triage.confidence,
          ai_pattern_used: triage.matchedPattern?.id,
          ai_suggested_articles: triage.suggestedArticles.map(a => a.slug),
        });

        await db.updateConversation(conversationId, {
          status: 'waiting_user',
          handled_by: conversation.handled_by || 'ai',
          ai_confidence_score: triage.confidence,
          matched_pattern_id: triage.matchedPattern?.id || conversation.matched_pattern_id,
        });
      }
      // Otherwise, trigger the full Support Agent for deeper analysis
      else if (env.ANTHROPIC_API_KEY) {
        // Trigger Support Agent asynchronously
        triggerSupportAgent(env, conversationId).catch((err) => {
          console.error('[Messages API] Failed to trigger support agent:', err);
        });
        agentTriggered = true;

        // Add a "typing" indicator message that will be replaced by agent
        await db.updateConversation(conversationId, {
          status: 'waiting_support',
          handled_by: 'ai',
        });
      }
    }

    // Get updated messages
    const messages = await db.getMessages(conversationId);

    return new Response(JSON.stringify({
      message: userMessage,
      aiResponse,
      agentTriggered,
      messages,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Add message error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * Trigger the Support Agent asynchronously
 */
async function triggerSupportAgent(env: Record<string, unknown>, conversationId: string): Promise<void> {
  const response = await fetch(`${getSiteUrl(env)}/api/support/agent/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Request': 'true',
    },
    body: JSON.stringify({ conversation_id: conversationId }),
  });

  if (!response.ok) {
    throw new Error(`Agent trigger failed: ${response.status}`);
  }
}
