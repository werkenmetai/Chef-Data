/**
 * Support Conversations API Endpoint
 *
 * GET /api/support/conversations - List user's conversations
 * POST /api/support/conversations - Create new conversation
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../../lib/database';
import { SupportAI } from '../../../../lib/support-ai';
import { getSiteUrl } from '../../../../lib/security';

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

// Helper to validate session
async function validateSession(db: Database, cookies: { get: (name: string) => { value?: string } | undefined }) {
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) return null;
  return await db.validateSession(sessionId);
}

/**
 * Get preferred language from Accept-Language header
 * FEAT-003: Extract language from browser instead of hardcoding
 */
function getPreferredLanguage(request: Request): 'nl' | 'en' {
  const acceptLanguage = request.headers.get('Accept-Language') || '';
  // Parse first language (e.g., "nl-NL,nl;q=0.9,en;q=0.8" → "nl")
  const match = acceptLanguage.match(/^([a-z]{2})/i);
  const lang = match ? match[1].toLowerCase() : 'nl';
  // Only support nl and en, default to nl
  return lang === 'en' ? 'en' : 'nl';
}

export const GET: APIRoute = async ({ cookies, locals, url }) => {
  try {
    const env = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;
    if (!env?.DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new Database(env.DB as D1Database, env.TOKEN_ENCRYPTION_KEY as string | undefined);
    const session = await validateSession(db, cookies);

    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const status = url.searchParams.get('status') || undefined;
    const conversations = await db.getUserConversations(session.user.id, status);

    return new Response(JSON.stringify({ conversations }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  try {
    const env = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;
    if (!env?.DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new Database(env.DB as D1Database, env.TOKEN_ENCRYPTION_KEY as string | undefined);
    const session = await validateSession(db, cookies);

    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if support is available
    const settings = await db.getAllSystemSettings();
    if (settings.support_enabled === 'false') {
      return new Response(JSON.stringify({ error: 'Support is disabled' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (settings.support_paused === 'true') {
      return new Response(JSON.stringify({
        error: 'Support is paused',
        message: settings.support_pause_message,
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body = await request.json() as {
      subject: string;
      category?: string;
      message: string;
    };

    if (!body.subject || !body.message) {
      return new Response(JSON.stringify({ error: 'Subject and message are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create AI service for triage
    const ai = new SupportAI(db);

    // Analyze the message
    const triage = await ai.analyzeMessage(body.message, {
      conversation: {} as any, // Will be created
      messages: [],
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        plan: session.user.plan,
        preferredLanguage: getPreferredLanguage(request),
      },
    });

    // Create conversation with triage results
    const conversation = await db.createConversation(
      session.user.id,
      body.subject,
      body.category || triage.category,
      triage.priority
    );

    // Add initial user message
    await db.addMessage(conversation.id, {
      sender_type: 'user',
      sender_id: session.user.id,
      content: body.message,
    });

    // Check if AI can auto-respond
    const aiEnabled = settings.support_ai_enabled !== 'false';
    const confidenceThreshold = parseFloat(settings.support_ai_confidence_threshold || '0.8');

    if (aiEnabled && triage.canAutoRespond && triage.confidence >= confidenceThreshold && triage.suggestedResponse) {
      // Add AI response
      await db.addMessage(conversation.id, {
        sender_type: 'ai',
        content: triage.suggestedResponse,
        ai_confidence: triage.confidence,
        ai_pattern_used: triage.matchedPattern?.id,
        ai_suggested_articles: triage.suggestedArticles.map(a => a.slug),
      });

      // Update conversation with AI info
      await db.updateConversation(conversation.id, {
        status: 'waiting_user',
        handled_by: 'ai',
        first_response_at: new Date().toISOString(),
        ai_confidence_score: triage.confidence,
        matched_pattern_id: triage.matchedPattern?.id || null,
      });
    } else if (triage.suggestedArticles.length > 0) {
      // Add system message with article suggestions
      const lang = getPreferredLanguage(request);
      const articlesMessage = ai.formatArticleSuggestions(triage.suggestedArticles, lang);
      if (articlesMessage) {
        await db.addMessage(conversation.id, {
          sender_type: 'system',
          content: articlesMessage,
        });
      }

      // Add acknowledgment message
      const ackMessage = lang === 'en'
        ? 'Thank you for your message! We will get back to you as soon as possible.'
        : 'Bedankt voor je bericht! We komen zo snel mogelijk bij je terug.';
      await db.addMessage(conversation.id, {
        sender_type: 'system',
        content: ackMessage,
      });

      // Mark as waiting for support and trigger agent
      await db.updateConversation(conversation.id, {
        status: 'waiting_support',
        handled_by: 'ai',
      });

      // Trigger Support Agent for deeper analysis
      if (aiEnabled && env.ANTHROPIC_API_KEY) {
        triggerSupportAgent(env, conversation.id).catch((err) => {
          console.error('[Conversations API] Failed to trigger support agent:', err);
        });
      }
    } else {
      // Add acknowledgment message when no AI auto-response
      const lang = getPreferredLanguage(request);
      const ackMessage = lang === 'en'
        ? 'Thank you for your message! We will get back to you as soon as possible.'
        : 'Bedankt voor je bericht! We komen zo snel mogelijk bij je terug.';
      await db.addMessage(conversation.id, {
        sender_type: 'system',
        content: ackMessage,
      });

      // Mark as waiting for support and trigger agent
      await db.updateConversation(conversation.id, {
        status: 'waiting_support',
        handled_by: 'ai',
      });

      // Trigger Support Agent for deeper analysis
      if (aiEnabled && env.ANTHROPIC_API_KEY) {
        triggerSupportAgent(env, conversation.id).catch((err) => {
          console.error('[Conversations API] Failed to trigger support agent:', err);
        });
      }
    }

    // Get the updated conversation with messages
    const data = await db.getConversationWithMessages(conversation.id);

    return new Response(JSON.stringify({
      conversation: data?.conversation,
      messages: data?.messages || [],
      suggestedArticles: triage.suggestedArticles,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
