/**
 * Feedback Opt-Out API
 *
 * POST /api/feedback/opt-out
 *
 * Allows users to opt out of feedback requests.
 */

import type { APIContext } from 'astro';
import { Database } from '../../../lib/database';

export async function POST(context: APIContext): Promise<Response> {
  const { request, cookies, locals } = context;
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const database = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY as string | undefined);

  try {
    const sessionId = cookies.get('session_id')?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sessionResult = await database.validateSession(sessionId);
    if (!sessionResult) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = sessionResult.user.id;
    const body = await request.json() as { opt_out: boolean };

    // Update user preference
    await env.DB.prepare(`
      UPDATE users SET feedback_opt_out = ? WHERE id = ?
    `).bind(body.opt_out ? 1 : 0, userId).run();

    // If opting out, cancel any scheduled campaigns
    if (body.opt_out) {
      await env.DB.prepare(`
        UPDATE feedback_campaigns
        SET status = 'cancelled'
        WHERE user_id = ? AND status = 'scheduled'
      `).bind(userId).run();
    }

    return new Response(JSON.stringify({
      success: true,
      opted_out: body.opt_out,
      message: body.opt_out
        ? 'Je ontvangt geen feedback verzoeken meer'
        : 'Feedback verzoeken zijn weer ingeschakeld',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Opt-Out API] Error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Also support GET for email unsubscribe links
export async function GET(context: APIContext): Promise<Response> {
  const { locals, url } = context;
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/feedback/unsubscribe?error=db_unavailable' },
    });
  }

  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/feedback/unsubscribe?error=missing_token' },
    });
  }

  try {
    // Find campaign by tracking token
    const campaign = await env.DB.prepare(`
      SELECT user_id FROM feedback_campaigns WHERE tracking_token = ?
    `).bind(token).first<{ user_id: string }>();

    if (!campaign) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': '/feedback/unsubscribe?error=invalid_token' },
      });
    }

    // Opt out the user
    await env.DB.prepare(`
      UPDATE users SET feedback_opt_out = 1 WHERE id = ?
    `).bind(campaign.user_id).run();

    // Cancel scheduled campaigns
    await env.DB.prepare(`
      UPDATE feedback_campaigns
      SET status = 'cancelled'
      WHERE user_id = ? AND status = 'scheduled'
    `).bind(campaign.user_id).run();

    // Mark this campaign as unsubscribed
    await env.DB.prepare(`
      UPDATE feedback_campaigns
      SET unsubscribed_at = CURRENT_TIMESTAMP, status = 'unsubscribed'
      WHERE tracking_token = ?
    `).bind(token).run();

    return new Response(null, {
      status: 302,
      headers: { 'Location': '/feedback/unsubscribe?success=true' },
    });

  } catch (error) {
    console.error('[Unsubscribe API] Error:', error);
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/feedback/unsubscribe?error=server_error' },
    });
  }
}
