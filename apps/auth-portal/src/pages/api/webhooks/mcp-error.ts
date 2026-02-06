/**
 * MCP Error Webhook
 *
 * Receives error reports from the MCP server and:
 * 1. Logs to support_error_log
 * 2. Creates auto-tickets for new/severe errors
 * 3. Triggers Support Agent for analysis
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../lib/database';
import { getSiteUrl } from '../../../lib/security';

interface ErrorPayload {
  user_id?: string;
  api_key_id?: string;
  error_type: string;
  error_code?: string;
  error_message: string;
  stack_trace?: string;
  tool_name?: string;
  request_context?: Record<string, unknown>;
  timestamp?: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env;

  // Validate webhook secret
  // SEC-002: Ensure WEBHOOK_SECRET is configured before comparing
  const configuredSecret = env?.WEBHOOK_SECRET;
  if (!configuredSecret) {
    console.error('[MCP Error Webhook] WEBHOOK_SECRET not configured');
    return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const webhookSecret = request.headers.get('X-Webhook-Secret');
  if (webhookSecret !== configuredSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);

  try {
    const payload: ErrorPayload = await request.json();

    // Validate required fields
    if (!payload.error_type || !payload.error_message) {
      return new Response(
        JSON.stringify({ error: 'error_type and error_message are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user_id from api_key if not provided
    let userId = payload.user_id;
    if (!userId && payload.api_key_id) {
      const apiKey = await db.get<{ user_id: string }>(
        'SELECT user_id FROM api_keys WHERE id = ?',
        [payload.api_key_id]
      );
      userId = apiKey?.user_id;
    }

    // Log the error
    const errorId = crypto.randomUUID();
    await db.run(
      `INSERT INTO support_error_log
       (id, user_id, error_type, error_code, error_message, error_context, stack_trace, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        errorId,
        userId || null,
        payload.error_type,
        payload.error_code || null,
        payload.error_message,
        payload.request_context ? JSON.stringify(payload.request_context) : null,
        payload.stack_trace || null,
      ]
    );

    // Check if we should create an auto-ticket
    const shouldCreateTicket = await shouldAutoCreateTicket(db, userId, payload);

    let conversationId: string | null = null;

    if (shouldCreateTicket && userId) {
      // Create auto-ticket
      conversationId = await createAutoTicket(db, userId, payload, errorId);

      // Trigger Support Agent (async, don't wait)
      if (env.ANTHROPIC_API_KEY && conversationId) {
        triggerSupportAgent(env, conversationId).catch((err) => {
          console.error('[MCP Error] Failed to trigger support agent:', err);
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        error_id: errorId,
        ticket_created: !!conversationId,
        conversation_id: conversationId,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('MCP error webhook failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process error',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Determine if we should auto-create a support ticket
 */
async function shouldAutoCreateTicket(
  db: Database,
  userId: string | undefined,
  payload: ErrorPayload
): Promise<boolean> {
  // No user = no ticket
  if (!userId) return false;

  // Check if support is enabled
  const supportEnabled = await db.getSystemSetting('support_enabled');
  if (supportEnabled === 'false') return false;

  // Severity-based rules
  const severeErrorTypes = [
    'AUTH_FAILED',
    'TOKEN_EXPIRED',
    'DIVISION_NOT_FOUND',
    'INTERNAL_ERROR',
    'CONNECTION_FAILED',
  ];

  if (severeErrorTypes.includes(payload.error_type.toUpperCase())) {
    // Check if user already has an open ticket for this error type
    const existingTicket = await db.get<{ id: string }>(
      `SELECT sc.id FROM support_conversations sc
       JOIN support_error_log sel ON sel.conversation_id = sc.id
       WHERE sc.user_id = ?
       AND sc.status NOT IN ('resolved', 'closed')
       AND sel.error_type = ?
       AND sc.created_at > datetime('now', '-24 hours')`,
      [userId, payload.error_type]
    );

    return !existingTicket;
  }

  // Check for error frequency (3+ same errors in 1 hour = create ticket)
  const recentCount = await db.get<{ count: number }>(
    `SELECT COUNT(*) as count FROM support_error_log
     WHERE user_id = ?
     AND error_type = ?
     AND created_at > datetime('now', '-1 hour')`,
    [userId, payload.error_type]
  );

  return (recentCount?.count || 0) >= 3;
}

/**
 * Create an automatic support ticket
 */
async function createAutoTicket(
  db: Database,
  userId: string,
  payload: ErrorPayload,
  errorId: string
): Promise<string> {
  // Determine category and priority
  const categoryMap: Record<string, string> = {
    AUTH_FAILED: 'connection',
    TOKEN_EXPIRED: 'connection',
    DIVISION_NOT_FOUND: 'connection',
    RATE_LIMIT: 'billing',
    INTERNAL_ERROR: 'bug',
    CONNECTION_FAILED: 'connection',
  };

  const priorityMap: Record<string, string> = {
    AUTH_FAILED: 'high',
    TOKEN_EXPIRED: 'normal',
    INTERNAL_ERROR: 'urgent',
    CONNECTION_FAILED: 'high',
  };

  const category = categoryMap[payload.error_type.toUpperCase()] || 'other';
  const priority = priorityMap[payload.error_type.toUpperCase()] || 'normal';

  // Create conversation
  const conversationId = crypto.randomUUID();
  await db.run(
    `INSERT INTO support_conversations
     (id, user_id, subject, status, priority, category, handled_by, created_at, updated_at)
     VALUES (?, ?, ?, 'open', ?, ?, 'ai', datetime('now'), datetime('now'))`,
    [
      conversationId,
      userId,
      `Automatisch ticket: ${payload.error_type}`,
      priority,
      category,
    ]
  );

  // Add system message explaining the auto-ticket
  const systemMessage = buildAutoTicketMessage(payload);
  await db.addMessage(conversationId, {
    sender_type: 'system',
    content: systemMessage,
  });

  // Link error to conversation
  await db.run(
    `UPDATE support_error_log SET conversation_id = ? WHERE id = ?`,
    [conversationId, errorId]
  );

  console.log(`[MCP Error] Created auto-ticket ${conversationId} for user ${userId}`);

  return conversationId;
}

/**
 * Build the system message for auto-ticket
 */
function buildAutoTicketMessage(payload: ErrorPayload): string {
  const parts = [
    `Dit ticket is automatisch aangemaakt vanwege een ${payload.error_type} error.`,
    '',
    `**Error Details:**`,
    `- Type: ${payload.error_type}`,
  ];

  if (payload.error_code) {
    parts.push(`- Code: ${payload.error_code}`);
  }

  parts.push(`- Bericht: ${payload.error_message}`);

  if (payload.tool_name) {
    parts.push(`- Tool: ${payload.tool_name}`);
  }

  parts.push('', 'Ons AI support team analyseert dit probleem...');

  return parts.join('\n');
}

/**
 * Trigger the Support Agent to analyze the ticket
 */
async function triggerSupportAgent(env: Record<string, unknown>, conversationId: string): Promise<void> {
  // Internal API call to trigger agent
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
