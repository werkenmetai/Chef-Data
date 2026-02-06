/**
 * Support Agent Trigger API
 *
 * Triggers the AI Support Agent to analyze and respond to a conversation.
 * Can be called manually or automatically after new messages.
 *
 * Supports:
 * - Pattern-based matching (SupportAI) for quick responses
 * - Claude-based agent (SupportAgent) for complex issues
 * - Admin instruction handling from email replies
 * - Guard rails: human request detection, response limits, content filtering
 */

import type { APIRoute } from 'astro';
import type { D1Database } from '@cloudflare/workers-types';
import { Database } from '../../../../lib/database';
import { SupportAI } from '../../../../lib/support-ai';
import { sendEmail, supportEscalationEmail } from '../../../../lib/email';
// Guard rails constants and functions
// Note: These are defined inline to avoid build complexity with workspace packages
const AI_RESPONSE_LIMIT = 5;
const CONFIDENCE_THRESHOLD = 0.5;

const HUMAN_REQUEST_PATTERNS = [
  // Dutch
  /\b(mens|persoon|medewerker|iemand)\b/i,
  /\b(echt|echte)\s*(mens|persoon|medewerker)/i,
  /\b(wil|kan|mag|graag).*praten.*met/i,
  /\b(wil|kan|mag|graag).*spreken.*met/i,
  /\b(niet|geen).*(robot|ai|bot|automatisch)/i,
  /\bgesproken\s*contact\b/i,
  /\btel(efoon|efonisch)\b/i,
  /\bbellen?\b/i,
  /\bsupport\s*team\b/i,
  // English
  /\b(human|person|agent|someone|real\s*person)\b/i,
  /\b(speak|talk).*to.*(human|person|someone|agent)\b/i,
  /\b(not|no).*(robot|ai|bot|automated)\b/i,
  /\bcall\s*(me|back)\b/i,
  /\bphone\s*(support|call)\b/i,
];

function customerWantsHuman(message: string): boolean {
  return HUMAN_REQUEST_PATTERNS.some((pattern) => pattern.test(message));
}

interface TriggerRequestBody {
  conversation_id?: string;
  conversationId?: string; // Alternative naming
  source?: string; // e.g., 'admin_email_reply'
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB as D1Database, env.TOKEN_ENCRYPTION_KEY as string | undefined);

  try {
    const body = await request.json() as TriggerRequestBody;
    const conversation_id = body.conversation_id || body.conversationId;
    const source = body.source;

    if (!conversation_id) {
      return new Response(
        JSON.stringify({ error: 'conversation_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get conversation
    const conversation = await db.getConversation(conversation_id);
    if (!conversation) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if AI is enabled
    const aiEnabled = await db.getSystemSetting('support_ai_enabled');
    if (aiEnabled === 'false') {
      return new Response(
        JSON.stringify({ error: 'AI support is disabled', skipped: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get conversation messages
    const messages = await db.getMessages(conversation_id);

    // Get the latest user message
    const latestUserMessage = messages
      .filter((m) => m.sender_type === 'user')
      .pop();

    if (!latestUserMessage) {
      return new Response(
        JSON.stringify({ error: 'No user message found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user info
    const user = await db.findUserById(conversation.user_id);

    // =================================================================
    // GUARD RAIL 1: Human Request Detection
    // =================================================================
    if (customerWantsHuman(latestUserMessage.content)) {
      console.log(`[Support Agent] Human request detected, auto-escalating`);

      // Send escalation email
      if (user) {
        const escalationEmailOptions = supportEscalationEmail({
          conversationId: conversation_id,
          customerEmail: user.email,
          customerName: user.name,
          customerPlan: user.plan,
          subject: conversation.subject || 'Support aanvraag',
          messages: messages.map((m) => ({
            sender_type: m.sender_type,
            content: m.content,
            created_at: m.created_at,
          })),
          aiAnalysis: {
            category: 'human_request',
            confidence: 1.0,
            attemptedSolutions: [],
          },
        });

        await sendEmail(
          { RESEND_API_KEY: env.RESEND_API_KEY as string | undefined },
          escalationEmailOptions
        );
      }

      // Add system message
      await db.addMessage(conversation_id, {
        sender_type: 'system',
        content: 'Klant vraagt om menselijke hulp - doorgestuurd naar support team.',
      });

      // Add customer-facing message
      await db.addMessage(conversation_id, {
        sender_type: 'ai',
        content: 'Ik begrijp het. Ik stuur je vraag door naar een van onze medewerkers. Je ontvangt zo snel mogelijk een email van ons.',
        ai_confidence: 1.0,
      });

      // Update conversation status
      await db.updateConversation(conversation_id, {
        status: 'waiting_support',
        handled_by: 'hybrid',
      });

      return new Response(
        JSON.stringify({
          success: true,
          action: 'escalated',
          reason: 'human_requested',
          message: 'Customer requested human assistance',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =================================================================
    // GUARD RAIL 2: Response Limit Check
    // =================================================================
    const aiResponseCount = messages.filter((m) => m.sender_type === 'ai').length;
    if (aiResponseCount >= AI_RESPONSE_LIMIT) {
      console.log(`[Support Agent] Response limit reached (${aiResponseCount}/${AI_RESPONSE_LIMIT})`);

      // Auto-escalate
      if (user) {
        const escalationEmailOptions = supportEscalationEmail({
          conversationId: conversation_id,
          customerEmail: user.email,
          customerName: user.name,
          customerPlan: user.plan,
          subject: conversation.subject || 'Support aanvraag',
          messages: messages.map((m) => ({
            sender_type: m.sender_type,
            content: m.content,
            created_at: m.created_at,
          })),
          aiAnalysis: {
            category: 'response_limit',
            confidence: 0.0,
            attemptedSolutions: ['AI response limit reached'],
          },
        });

        await sendEmail(
          { RESEND_API_KEY: env.RESEND_API_KEY as string | undefined },
          escalationEmailOptions
        );
      }

      // Add system message
      await db.addMessage(conversation_id, {
        sender_type: 'system',
        content: `AI response limiet bereikt (${AI_RESPONSE_LIMIT}) - automatisch doorgestuurd naar support team.`,
      });

      // Update conversation status
      await db.updateConversation(conversation_id, {
        status: 'waiting_support',
        handled_by: 'hybrid',
      });

      return new Response(
        JSON.stringify({
          success: true,
          action: 'escalated',
          reason: 'response_limit_reached',
          message: `AI response limit (${AI_RESPONSE_LIMIT}) reached`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =================================================================
    // Check for Admin Instructions (from email reply)
    // =================================================================
    const latestAdminMessage = messages
      .filter((m) => m.sender_type === 'admin')
      .pop();

    const hasAdminInstructions = source === 'admin_email_reply' && latestAdminMessage;

    // =================================================================
    // Use SupportAI for pattern-based analysis
    // =================================================================
    const ai = new SupportAI(db);
    const triage = await ai.analyzeMessage(latestUserMessage.content, {
      conversation,
      messages: messages.map((m) => ({ sender_type: m.sender_type, content: m.content })),
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        preferredLanguage: 'nl' as const,
      } : {
        id: conversation.user_id,
        email: 'unknown',
        name: null,
        plan: 'free',
        preferredLanguage: 'nl' as const,
      },
    });

    let action: 'resolved' | 'responded' | 'pending' | 'escalated' = 'pending';

    // =================================================================
    // Handle Admin Instructions - Follow admin's guidance
    // =================================================================
    if (hasAdminInstructions && latestAdminMessage) {
      console.log(`[Support Agent] Processing admin instructions`);

      // The admin message content IS the instruction to follow
      // Format a response based on the admin's input
      const adminContent = latestAdminMessage.content;

      // If admin provided a direct response, use it
      // Add AI message acknowledging admin instruction was followed
      await db.addMessage(conversation_id, {
        sender_type: 'ai',
        content: adminContent,
        ai_confidence: 1.0,
        metadata: { admin_instructed: true },
      });

      // Update conversation status - waiting for customer response
      await db.updateConversation(conversation_id, {
        status: 'waiting_user',
        handled_by: 'hybrid',
      });

      action = 'responded';

      console.log(`[Support Agent] Admin instruction processed for ${conversation_id}`);

      return new Response(
        JSON.stringify({
          success: true,
          action,
          admin_instructed: true,
          message: 'Admin instructions followed',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =================================================================
    // Standard Processing: Pattern matching + Article suggestions
    // =================================================================
    const confidenceThreshold = parseFloat(
      await db.getSystemSetting('support_ai_confidence_threshold') || '0.8'
    );

    if (triage.canAutoRespond && triage.confidence >= confidenceThreshold && triage.suggestedResponse) {
      // Add AI response
      await db.addMessage(conversation_id, {
        sender_type: 'ai',
        content: triage.suggestedResponse,
        ai_confidence: triage.confidence,
        ai_pattern_used: triage.matchedPattern?.id,
        ai_suggested_articles: triage.suggestedArticles.map((a) => a.slug),
      });

      // Update conversation
      await db.updateConversation(conversation_id, {
        status: 'waiting_user',
        handled_by: 'ai',
        ai_confidence_score: triage.confidence,
        matched_pattern_id: triage.matchedPattern?.id,
      });

      action = 'responded';
    } else if (triage.suggestedArticles.length > 0) {
      // Add article suggestions
      const articlesMessage = ai.formatArticleSuggestions(triage.suggestedArticles, 'nl');
      if (articlesMessage) {
        await db.addMessage(conversation_id, {
          sender_type: 'system',
          content: articlesMessage,
        });
      }
      action = 'responded';
    } else if (triage.confidence < CONFIDENCE_THRESHOLD) {
      // =================================================================
      // GUARD RAIL 3: Low Confidence Auto-Escalation
      // =================================================================
      console.log(`[Support Agent] Low confidence (${triage.confidence}), auto-escalating`);

      if (user) {
        const escalationEmailOptions = supportEscalationEmail({
          conversationId: conversation_id,
          customerEmail: user.email,
          customerName: user.name,
          customerPlan: user.plan,
          subject: conversation.subject || 'Support aanvraag',
          messages: messages.map((m) => ({
            sender_type: m.sender_type,
            content: m.content,
            created_at: m.created_at,
          })),
          aiAnalysis: {
            category: triage.category,
            confidence: triage.confidence,
            attemptedSolutions: [],
          },
        });

        await sendEmail(
          { RESEND_API_KEY: env.RESEND_API_KEY as string | undefined },
          escalationEmailOptions
        );
      }

      // Add system message
      await db.addMessage(conversation_id, {
        sender_type: 'system',
        content: `Lage AI confidence (${Math.round(triage.confidence * 100)}%) - doorgestuurd naar support team.`,
      });

      // Add customer-facing message
      await db.addMessage(conversation_id, {
        sender_type: 'ai',
        content: 'Ik wil er zeker van zijn dat je goed geholpen wordt, dus ik stuur je vraag door naar een medewerker. Je hoort zo snel mogelijk van ons!',
        ai_confidence: triage.confidence,
      });

      // Update conversation status
      await db.updateConversation(conversation_id, {
        status: 'waiting_support',
        handled_by: 'hybrid',
        ai_confidence_score: triage.confidence,
      });

      action = 'escalated';
    }

    // Log agent activity
    console.log(`[Support Agent] Completed for ${conversation_id}:`, {
      action,
      confidence: triage.confidence,
      canAutoRespond: triage.canAutoRespond,
      articlesFound: triage.suggestedArticles.length,
      aiResponseCount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        action,
        confidence: triage.confidence,
        category: triage.category,
        priority: triage.priority,
        articles_suggested: triage.suggestedArticles.length,
        ai_response_count: aiResponseCount,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Support agent trigger error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
