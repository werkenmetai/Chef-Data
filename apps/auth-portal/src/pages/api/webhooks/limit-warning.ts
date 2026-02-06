/**
 * Limit Warning Webhook
 *
 * Receives 80% rate limit warnings from MCP server and sends
 * email to user if not already sent this month.
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../lib/database';
import { sendEmail, rateLimitWarningEmail } from '../../../lib/email';

interface LimitWarningPayload {
  user_id: string;
  used: number;
  limit: number;
  plan: string;
  percent: number;
  timestamp: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env;

  // Validate webhook secret
  const configuredSecret = env?.WEBHOOK_SECRET;
  if (!configuredSecret) {
    console.error('[Limit Warning] WEBHOOK_SECRET not configured');
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
    const payload: LimitWarningPayload = await request.json();

    // Validate required fields
    if (!payload.user_id || !payload.used || !payload.limit) {
      return new Response(
        JSON.stringify({ error: 'user_id, used, and limit are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user info
    const user = await db.get<{
      email: string;
      name: string | null;
      limit_warning_sent_at: string | null;
    }>(
      'SELECT email, name, limit_warning_sent_at FROM users WHERE id = ?',
      [payload.user_id]
    );

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found', sent: false }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if we already sent a warning this month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    if (user.limit_warning_sent_at) {
      const sentMonth = user.limit_warning_sent_at.slice(0, 7);
      if (sentMonth === currentMonth) {
        // Already sent this month, skip
        return new Response(
          JSON.stringify({
            success: true,
            sent: false,
            reason: 'already_sent_this_month'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Send the warning email
    const emailOptions = rateLimitWarningEmail(
      user.name || '',
      payload.used,
      payload.limit
    );
    emailOptions.to = user.email;
    emailOptions.userId = payload.user_id;
    emailOptions.templateName = 'rate_limit_warning';

    const sent = await sendEmail(env, emailOptions);

    if (sent) {
      // Update limit_warning_sent_at
      await db.run(
        `UPDATE users SET limit_warning_sent_at = datetime('now') WHERE id = ?`,
        [payload.user_id]
      );

      console.log(`[Limit Warning] Sent ${payload.percent}% warning to ${user.email}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        email: user.email,
        percent: payload.percent,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Limit Warning] Webhook failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process warning',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
